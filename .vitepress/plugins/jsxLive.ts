import type MarkdownIt from 'markdown-it';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function splitImportsAndCode(raw: string) {
  const lines = raw.replace(/\n$/, '').split('\n');

  const importLines: string[] = [];
  let cursor = 0;
  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor];
    if (/^\s*import\s/.test(line)) {
      importLines.push(line);
      continue;
    }

    break;
  }

  while (cursor < lines.length && /^\s*$/.test(lines[cursor] ?? '')) cursor++;

  return {
    imports: importLines.join('\n'),
    code: lines.slice(cursor).join('\n'),
  };
}

function encodeBase64(text: string) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function getMarkdownFileAbsolutePath(env: any) {
  const absoluteFromEnv = typeof env?.path === 'string' && path.isAbsolute(env.path) ? env.path : null;
  const relative = typeof env?.relativePath === 'string' ? env.relativePath : null;

  if (absoluteFromEnv) return absoluteFromEnv;
  if (relative) return path.resolve(process.cwd(), relative);

  return null;
}

function rewriteImportSource(source: string, markdownFileAbs: string) {
  if (!source.startsWith('.')) return source;
  const resolved = path.resolve(path.dirname(markdownFileAbs), source);
  return `/@fs${resolved}`;
}

function parseImportLine(line: string) {
  const sideEffectMatch = line.match(/^\s*import\s+['"](?<source>[^'"]+)['"]\s*;?\s*$/);
  if (sideEffectMatch?.groups?.source) {
    return { source: sideEffectMatch.groups.source, bindings: [] as string[], isTypeOnly: false };
  }

  const match = line.match(/^\s*import\s+(?<clause>.+?)\s+from\s+['"](?<source>[^'"]+)['"]\s*;?\s*$/);
  if (!match?.groups?.source || !match.groups.clause) return null;

  const clause = match.groups.clause.trim().replace(/^type\s+/, '');
  const source = match.groups.source;
  const bindings: string[] = [];

  // import * as ns from 'x'
  const namespaceMatch = clause.match(/^\*\s+as\s+(?<name>[A-Za-z_$][\w$]*)$/);
  if (namespaceMatch?.groups?.name) {
    bindings.push(namespaceMatch.groups.name);
    return { source, bindings, isTypeOnly: /^\s*import\s+type\s+/.test(line) };
  }

  // import defaultName, { a as b } from 'x'
  const combinedMatch = clause.match(/^(?<def>[A-Za-z_$][\w$]*)\s*,\s*\{(?<named>.*)\}$/);
  if (combinedMatch?.groups?.def) bindings.push(combinedMatch.groups.def);
  if (combinedMatch?.groups?.named != null) {
    const parts = combinedMatch.groups.named
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      const cleaned = part.replace(/^type\s+/, '');
      const aliasMatch = cleaned.match(/^(?<imported>[A-Za-z_$][\w$]*)\s+as\s+(?<local>[A-Za-z_$][\w$]*)$/);
      bindings.push(aliasMatch?.groups?.local ?? cleaned);
    }
    return { source, bindings, isTypeOnly: /^\s*import\s+type\s+/.test(line) };
  }

  // import { a, b as c } from 'x'
  const namedMatch = clause.match(/^\{(?<named>.*)\}$/);
  if (namedMatch?.groups?.named != null) {
    const parts = namedMatch.groups.named
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      const cleaned = part.replace(/^type\s+/, '');
      const aliasMatch = cleaned.match(/^(?<imported>[A-Za-z_$][\w$]*)\s+as\s+(?<local>[A-Za-z_$][\w$]*)$/);
      bindings.push(aliasMatch?.groups?.local ?? cleaned);
    }
    return { source, bindings, isTypeOnly: /^\s*import\s+type\s+/.test(line) };
  }

  // import defaultName from 'x'
  const defaultMatch = clause.match(/^(?<def>[A-Za-z_$][\w$]*)$/);
  if (defaultMatch?.groups?.def) {
    bindings.push(defaultMatch.groups.def);
    return { source, bindings, isTypeOnly: /^\s*import\s+type\s+/.test(line) };
  }

  return null;
}

function buildScopeModuleSource(markdownFileAbs: string, imports: string) {
  const importLines = imports
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const rewrittenImports: string[] = [];
  const bindings: string[] = [];

  for (const line of importLines) {
    const parsed = parseImportLine(line);
    if (!parsed || parsed.isTypeOnly) continue;

    const newSource = rewriteImportSource(parsed.source, markdownFileAbs);
    const rewritten = line.replace(parsed.source, newSource);
    rewrittenImports.push(rewritten);
    bindings.push(...parsed.bindings);
  }

  const scopeKeys = Array.from(new Set(bindings)).filter((b) => b !== 'React');
  const scopeLines = ['React: __React', ...scopeKeys].join(',\n  ');

  return [
    `import * as __React from 'react';`,
    ...rewrittenImports,
    '',
    'const scope = {',
    `  ${scopeLines}`,
    '};',
    '',
    'export default scope;',
    '',
  ].join('\n');
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function upsertFile(filePath: string, content: string) {
  try {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) return;
  } catch {
    // ignore
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

export function jsxLivePlugin(md: MarkdownIt) {
  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim();
    const [lang, ...meta] = info.split(/\s+/);

    const isLive = meta.includes('live') && (lang === 'jsx' || lang === 'tsx');
    if (!isLive) return defaultFence(tokens, idx, options, env, self);

    const { imports, code } = splitImportsAndCode(token.content);
    const markdownFileAbs = getMarkdownFileAbsolutePath(env);
    if (!markdownFileAbs) {
      return `<JsxLive lang="${lang}" codeB64="${encodeBase64(code)}" importsB64="${encodeBase64(imports)}" />`;
    }

    const liveIndex = typeof env.__jsxLiveIndex === 'number' ? env.__jsxLiveIndex : 0;
    env.__jsxLiveIndex = liveIndex + 1;

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ markdownFileAbs, liveIndex, imports }))
      .digest('hex')
      .slice(0, 16);

    const tempDir = path.resolve(process.cwd(), '.vitepress/.temp/jsx-live');
    const scopeModuleAbs = path.join(tempDir, `${hash}.ts`);
    ensureDir(tempDir);
    upsertFile(scopeModuleAbs, buildScopeModuleSource(markdownFileAbs, imports));

    if (env?.sfcBlocks?.scripts) {
      if (!env.__jsxLiveScriptSetup) {
        const block = { type: 'script', content: '<script setup>\n</script>' };
        env.__jsxLiveScriptSetup = { block, inner: '' as string, hasVueHelpers: false as boolean };
        env.sfcBlocks.scripts.push(block);
      }

      const scopeVar = `__jsxLiveScope_${liveIndex}`;
      if (!env.__jsxLiveScriptSetup.hasVueHelpers) {
        env.__jsxLiveScriptSetup.inner += `import { onMounted, shallowRef } from 'vue';\n`;
        env.__jsxLiveScriptSetup.hasVueHelpers = true;
      }

      env.__jsxLiveScriptSetup.inner += `const ${scopeVar} = shallowRef();\n`;
      env.__jsxLiveScriptSetup.inner += `onMounted(async () => {\n`;
      env.__jsxLiveScriptSetup.inner += `  ${scopeVar}.value = (await import('/@fs${scopeModuleAbs}')).default;\n`;
      env.__jsxLiveScriptSetup.inner += `});\n`;

      env.__jsxLiveScriptSetup.block.content = `<script setup>\n${env.__jsxLiveScriptSetup.inner}</script>`;

      return `<JsxLive :scope="${scopeVar}" lang="${lang}" codeB64="${encodeBase64(code)}" importsB64="${encodeBase64(imports)}" />`;
    }

    // Fallback if VitePress env shape changes: render without scope.
    return `<JsxLive lang="${lang}" codeB64="${encodeBase64(code)}" importsB64="${encodeBase64(imports)}" />`;
  };
}
