import type MarkdownIt from 'markdown-it';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'react-docgen';

type DocgenProp = {
  name: string;
  required: boolean;
  description?: string;
  type?: { name?: string; value?: any };
  defaultValue?: { value?: string };
};

type DocgenComponent = {
  displayName?: string;
  description?: string;
  props: Record<string, DocgenProp>;
};

function encodeBase64(text: string) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function getMarkdownFileAbsolutePath(env: any) {
  const relative = typeof env?.relativePath === 'string' ? env.relativePath : null;
  if (!relative) return null;
  return path.resolve(process.cwd(), relative);
}

function findSiblingComponentFile(markdownFileAbs: string) {
  const dir = path.dirname(markdownFileAbs);
  const base = path.basename(markdownFileAbs, path.extname(markdownFileAbs));
  const candidates = ['.tsx', '.ts', '.jsx', '.js'].map((ext) => path.join(dir, `${base}${ext}`));
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function tryParseDocgen(componentFileAbs: string): DocgenComponent | null {
  const src = fs.readFileSync(componentFileAbs, 'utf8');
  try {
    const parsed = parse(src, undefined, undefined, { filename: componentFileAbs }) as any;
    const info = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!info || typeof info !== 'object') return null;
    return info as DocgenComponent;
  } catch {
    return null;
  }
}

function resolveLocalImportSource(componentSource: string, identifier: string) {
  const importRe = new RegExp(
    String.raw`^\s*import\s+${identifier}\s+from\s+['"](?<source>[^'"]+)['"]\s*;?\s*$`,
    'm'
  );
  const match = componentSource.match(importRe);
  return match?.groups?.source ?? null;
}

function mergeProps(into: DocgenComponent, from: DocgenComponent) {
  into.props = { ...from.props, ...into.props };
  return into;
}

function buildMergedDocgen(componentFileAbs: string) {
  const src = fs.readFileSync(componentFileAbs, 'utf8');
  const primary = tryParseDocgen(componentFileAbs);
  if (!primary) return null;

  const spreadMatches = Array.from(src.matchAll(/\.\.\.(?<id>[A-Za-z_$][\w$]*)\.propTypes/g)).map(
    (m) => m.groups?.id
  );
  for (const identifier of spreadMatches) {
    if (!identifier) continue;
    const importedFrom = resolveLocalImportSource(src, identifier);
    if (!importedFrom || !importedFrom.startsWith('.')) continue;

    const resolved = path.resolve(path.dirname(componentFileAbs), importedFrom);
    const candidates = ['.tsx', '.ts', '.jsx', '.js'].map((ext) => `${resolved}${ext}`);
    const target = candidates.find((c) => fs.existsSync(c));
    if (!target) continue;

    const dep = tryParseDocgen(target);
    if (dep) mergeProps(primary, dep);
  }

  const props = Object.values(primary.props ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  return {
    displayName: primary.displayName,
    description: primary.description,
    props,
  };
}

export function propsTablePlugin(md: MarkdownIt) {
  md.core.ruler.after('inline', 'auto-props-table', (state) => {
    const env: any = state.env;
    const relativePath = typeof env?.relativePath === 'string' ? env.relativePath : '';

    if (!relativePath.startsWith('react-vectormap/src/') || !relativePath.endsWith('.md')) return;
    if (state.src.includes('<PropsTable')) return;

    const markdownFileAbs = getMarkdownFileAbsolutePath(env);
    if (!markdownFileAbs) return;

    const componentFileAbs = findSiblingComponentFile(markdownFileAbs);
    if (!componentFileAbs) return;

    const doc = buildMergedDocgen(componentFileAbs);
    if (!doc) return;

    const b64 = encodeBase64(JSON.stringify(doc));
    const Token = state.Token;

    const hOpen = new Token('heading_open', 'h2', 1);
    hOpen.markup = '##';
    const inline = new Token('inline', '', 0);
    inline.content = 'Props';
    inline.children = [];
    const hClose = new Token('heading_close', 'h2', -1);
    hClose.markup = '##';

    const html = new Token('html_block', '', 0);
    html.content = `<PropsTable docgenB64="${b64}" />\n`;

    state.tokens.push(hOpen, inline, hClose, html);
  });
}

