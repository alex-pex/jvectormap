import type MarkdownIt from 'markdown-it';

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

    return `<JsxLive lang="${lang}" codeB64="${encodeBase64(code)}" importsB64="${encodeBase64(imports)}" />`;
  };
}

