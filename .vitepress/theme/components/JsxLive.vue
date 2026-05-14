<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  codeB64: string;
  importsB64: string;
  lang: 'jsx' | 'tsx';
}>();

function decodeBase64Utf8(b64: string) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const imports = computed(() => decodeBase64Utf8(props.importsB64).trim());
const code = computed(() => decodeBase64Utf8(props.codeB64).trim());
</script>

<template>
  <div class="jsx-live">
    <pre v-if="imports" class="imports">{{ imports }}</pre>
    <pre class="code">{{ code }}</pre>
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
</style>

