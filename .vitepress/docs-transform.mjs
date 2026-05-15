import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'react-docgen';

const COMPONENT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const DOCS_OUTPUT_SEGMENT = `${path.sep}docs${path.sep}`;

function encode(value) {
  return encodeURIComponent(JSON.stringify(value));
}

function normalizeToPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function resolveFile(fromDirectory, specifier) {
  const resolvedPath = path.resolve(fromDirectory, specifier);

  if (path.extname(resolvedPath)) {
    return fs.existsSync(resolvedPath) ? resolvedPath : null;
  }

  for (const extension of COMPONENT_EXTENSIONS) {
    const candidate = `${resolvedPath}${extension}`;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function parseNamedImports(specifier) {
  const content = specifier.slice(1, -1).trim();
  if (!content) return [];

  return content.split(',').map(item => {
    const [imported, local] = item.trim().split(/\s+as\s+/);
    return {
      kind: 'named',
      imported: imported.trim(),
      local: (local || imported).trim(),
    };
  });
}

function parseImportBindings(specifier) {
  const value = specifier.trim();
  if (!value) return [];

  const bindings = [];
  let rest = value;
  const namedStart = value.indexOf('{');
  const namespaceStart = value.indexOf('*');
  const splitIndex = [namedStart, namespaceStart].filter(index => index > 0).sort((a, b) => a - b)[0];

  if (splitIndex > 0) {
    const defaultImport = value.slice(0, splitIndex).replace(/,$/, '').trim();
    if (defaultImport) {
      bindings.push({ kind: 'default', imported: 'default', local: defaultImport });
    }
    rest = value.slice(splitIndex).replace(/^,\s*/, '').trim();
  }

  if (rest.startsWith('{')) {
    bindings.push(...parseNamedImports(rest));
  } else if (rest.startsWith('* as ')) {
    bindings.push({
      kind: 'namespace',
      imported: '*',
      local: rest.slice(5).trim(),
    });
  } else if (rest && splitIndex === undefined) {
    bindings.push({ kind: 'default', imported: 'default', local: rest });
  }

  return bindings;
}

function parseImportStatement(statement, markdownPath) {
  const sideEffectMatch = statement.match(/^import\s+['"](.+?)['"]\s*;?$/);
  if (sideEffectMatch) {
    return {
      source: sideEffectMatch[1],
      resolvedSource: sideEffectMatch[1],
      imports: [],
    };
  }

  const match = statement.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;?$/);
  if (!match) {
    throw new Error(`Unsupported live JSX import in ${markdownPath}: ${statement}`);
  }

  const [, bindings, source] = match;
  const markdownDirectory = path.dirname(markdownPath);
  const resolvedRelativeFile = source.startsWith('.')
    ? resolveFile(markdownDirectory, source)
    : null;

  return {
    source,
    resolvedSource: resolvedRelativeFile
      ? `/${normalizeToPosix(path.relative(process.cwd(), resolvedRelativeFile))}`
      : source,
    imports: parseImportBindings(bindings),
  };
}

function extractLiveBlock(block, markdownPath) {
  const importLines = [];
  const bodyLines = [];
  let parsingImports = true;

  for (const line of block.split(/\r?\n/)) {
    if (parsingImports && /^\s*import\s/.test(line)) {
      importLines.push(line.trim());
      continue;
    }

    if (parsingImports && !line.trim() && importLines.length > 0) {
      parsingImports = false;
      continue;
    }

    parsingImports = false;
    bodyLines.push(line);
  }

  const code = bodyLines.join('\n').trim();
  const imports = importLines.map(line => parseImportStatement(line, markdownPath));

  if (!code) {
    throw new Error(`Empty live JSX block in ${markdownPath}`);
  }

  return {
    code,
    imports,
  };
}

function formatPropType(type) {
  if (!type) return '';

  if (typeof type === 'string') {
    return type;
  }

  if (Array.isArray(type)) {
    return type.map(formatPropType).join(', ');
  }

  switch (type.name) {
    case 'union':
    case 'enum':
      return type.value.map(formatPropType).join(' | ');
    case 'arrayOf':
    case 'objectOf':
    case 'instanceOf':
      return `${type.name}(${formatPropType(type.value)})`;
    case 'shape':
    case 'exact':
      return `${type.name}({ ${Object.entries(type.value || {})
        .map(([key, value]) => `${key}: ${formatPropType(value)}`)
        .join(', ')} })`;
    default:
      if (type.value && typeof type.value === 'string') {
        return `${type.name}(${type.value})`;
      }

      if (type.value && typeof type.value === 'object') {
        return `${type.name}(${formatPropType(type.value)})`;
      }

      return type.name || '';
  }
}

function readComponentDoc(componentPath, visited = new Set()) {
  if (visited.has(componentPath)) return null;
  visited.add(componentPath);

  const source = fs.readFileSync(componentPath, 'utf8');
  const docs = parse(source, {
    babelOptions: {
      babelrc: false,
      configFile: false,
    },
  });
  const componentDoc = docs[0];

  if (!componentDoc) {
    return null;
  }

  const inheritedProps = (componentDoc.composes || []).reduce((accumulator, composedPath) => {
    if (!composedPath.startsWith('.')) {
      return accumulator;
    }

    const resolvedComponentPath = resolveFile(path.dirname(componentPath), composedPath);
    if (!resolvedComponentPath) {
      return accumulator;
    }

    const composedDoc = readComponentDoc(resolvedComponentPath, visited);
    return composedDoc ? { ...accumulator, ...composedDoc.props } : accumulator;
  }, {});

  const props = { ...inheritedProps, ...(componentDoc.props || {}) };

  return {
    displayName: componentDoc.displayName || path.basename(componentPath, path.extname(componentPath)),
    description: componentDoc.description || '',
    props: Object.entries(props)
      .map(([name, value]) => ({
        name,
        required: Boolean(value.required),
        type: formatPropType(value.type),
        defaultValue: value.defaultValue ? value.defaultValue.value : '',
        description: value.description || '',
      }))
      .sort((left, right) => {
        if (left.required !== right.required) {
          return left.required ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      }),
  };
}

function findAdjacentComponent(markdownPath) {
  const basePath = markdownPath.slice(0, -path.extname(markdownPath).length);

  for (const extension of COMPONENT_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function createDocsTransformPlugin() {
  return {
    name: 'jvectormap-docs-transform',
    enforce: 'pre',
    transform(source, id) {
      if (!id.endsWith('.md') || id.includes(DOCS_OUTPUT_SEGMENT)) {
        return null;
      }

      let transformedSource = source.replace(/```jsx live\r?\n([\s\S]*?)```/g, (_, block) => {
        const liveBlock = extractLiveBlock(block, id);
        return `<JsxLive code="${encode(liveBlock.code)}" imports="${encode(liveBlock.imports)}" />`;
      });

      const adjacentComponent = findAdjacentComponent(id);

      if (adjacentComponent) {
        const docData = readComponentDoc(adjacentComponent);
        if (docData && docData.props.length > 0) {
          transformedSource = `${transformedSource.trimEnd()}\n\n<ReactPropTable data="${encode(docData)}" />\n`;
        }
      }

      return transformedSource === source ? null : transformedSource;
    },
  };
}
