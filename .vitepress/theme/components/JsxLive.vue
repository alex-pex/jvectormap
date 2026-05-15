<script setup>
import * as Babel from '@babel/standalone';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { codeToHtml } from 'shiki';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  imports: {
    type: String,
    required: true,
  },
});

const moduleImporters = import.meta.glob([
  '/react-vectormap/src/**/*.{js,jsx,ts,tsx}',
  '/jvectormap-content/esm/**/*.js',
]);

const decodedCode = JSON.parse(decodeURIComponent(props.code));
const importDefinitions = JSON.parse(decodeURIComponent(props.imports));
const editableCode = ref(decodedCode);
const error = ref('');
const highlightedCode = ref('');
const editorRef = ref(null);
const editorHighlightRef = ref(null);
const previewRef = ref(null);
const loadedScope = ref(null);
let highlightRequestId = 0;

const isReady = computed(() => loadedScope.value !== null);

function unmountPreview() {
  if (previewRef.value) {
    ReactDOM.unmountComponentAtNode(previewRef.value);
  }
}

function resolveImportValue(moduleExports, binding) {
  if (binding.kind === 'default') {
    return moduleExports.default;
  }

  if (binding.kind === 'namespace') {
    return moduleExports;
  }

  return moduleExports[binding.imported];
}

async function buildScope() {
  const scope = {};

  for (const definition of importDefinitions) {
    let moduleExports = {};

    if (definition.resolvedSource.startsWith('/')) {
      const importer = moduleImporters[definition.resolvedSource];
      if (!importer) {
        throw new Error(`Unable to resolve live import: ${definition.source}`);
      }
      moduleExports = await importer();
    } else if (!definition.imports.length) {
      await import(/* @vite-ignore */ definition.resolvedSource);
      continue;
    } else {
      moduleExports = await import(/* @vite-ignore */ definition.resolvedSource);
    }

    for (const binding of definition.imports) {
      scope[binding.local] = resolveImportValue(moduleExports, binding);
    }
  }

  return scope;
}

function compilePreview(code, scope) {
  const transformed = Babel.transform(`(${code})`, {
    presets: ['react'],
  }).code.trim().replace(/;$/, '');
  const scopeKeys = Object.keys(scope);
  const scopeValues = Object.values(scope);
  const factory = new Function('React', ...scopeKeys, `return (${transformed});`);
  return factory(React, ...scopeValues);
}

async function renderHighlightedCode() {
  const requestId = ++highlightRequestId;
  const html = await codeToHtml(editableCode.value || ' ', {
    lang: 'jsx',
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
  });

  if (requestId !== highlightRequestId) {
    return;
  }

  highlightedCode.value = html.replace('<pre class="shiki', '<pre class="shiki jsx-live__shiki');
  await nextTick();
  syncEditorScroll();
}

function syncEditorScroll() {
  const editorElement = editorRef.value;
  const highlightElement = editorHighlightRef.value;

  if (!editorElement || !highlightElement) {
    return;
  }

  highlightElement.scrollTop = editorElement.scrollTop;
  highlightElement.scrollLeft = editorElement.scrollLeft;
}

async function renderPreview() {
  if (!previewRef.value || !isReady.value) {
    return;
  }

  try {
    error.value = '';
    const element = compilePreview(editableCode.value, loadedScope.value);
    ReactDOM.render(element, previewRef.value);
  } catch (renderError) {
    unmountPreview();
    error.value = renderError instanceof Error ? renderError.message : String(renderError);
  }
}

onMounted(async () => {
  try {
    await renderHighlightedCode();
    loadedScope.value = await buildScope();
    await nextTick();
    await renderPreview();
  } catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : String(loadError);
  }
});

onBeforeUnmount(() => {
  unmountPreview();
});

watch(editableCode, () => {
  renderHighlightedCode();
  renderPreview();
});
</script>

<template>
  <div class="jsx-live">
    <div class="jsx-live__editor-shell">
      <div ref="editorHighlightRef" class="jsx-live__editor-highlight" aria-hidden="true" v-html="highlightedCode" />
      <textarea
        ref="editorRef"
        v-model="editableCode"
        class="jsx-live__editor"
        spellcheck="false"
        @scroll="syncEditorScroll"
      />
    </div>
    <div ref="previewRef" class="jsx-live__preview" />
    <pre v-if="error" class="jsx-live__error">{{ error }}</pre>
  </div>
</template>
