<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  codeB64: string;
  importsB64: string;
  lang: 'jsx' | 'tsx';
  scope?: Record<string, unknown>;
}>();

function decodeBase64Utf8(b64: string) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const imports = computed(() => decodeBase64Utf8(props.importsB64).trim());
const code = computed(() => decodeBase64Utf8(props.codeB64).trim());

const mountEl = ref<HTMLElement | null>(null);
let unmountReact: (() => void) | null = null;

async function renderReact() {
  if (!mountEl.value) return;
  if (!props.scope) return;

  const [reactMod, reactDomMod, { JsxLiveReact }] = await Promise.all([
    import('react'),
    import('react-dom'),
    import('../react/JsxLiveReact'),
  ]);

  const React = (reactMod as any).default ?? reactMod;
  const ReactDOM = (reactDomMod as any).default ?? reactDomMod;

  ReactDOM.render(React.createElement(JsxLiveReact, { code: code.value, scope: props.scope }), mountEl.value);
  unmountReact = () => ReactDOM.unmountComponentAtNode(mountEl.value as Element);
}

onMounted(() => {
  void renderReact();
});

watch(
  () => props.scope,
  () => {
    void renderReact();
  }
);

onBeforeUnmount(() => {
  unmountReact?.();
  unmountReact = null;
});
</script>

<template>
  <div class="jsx-live">
    <pre v-if="imports" class="imports">{{ imports }}</pre>
    <ClientOnly>
      <div v-if="scope" ref="mountEl" class="mount" />
      <pre v-else class="code">{{ code }}</pre>
    </ClientOnly>
  </div>
</template>

<style scoped>
.jsx-live {
  margin: 16px 0;
}
.imports,
.code {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  overflow: auto;
}
.imports {
  margin-bottom: 8px;
  background: var(--vp-c-bg-soft);
}
.mount {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
</style>
