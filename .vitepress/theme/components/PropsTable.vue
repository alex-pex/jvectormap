<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  docgenB64: string;
}>();

function decodeBase64Utf8(b64: string) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

type Docgen = {
  displayName?: string;
  description?: string;
  props: Array<{
    name: string;
    required: boolean;
    description?: string;
    type?: { name?: string; value?: any };
    defaultValue?: { value?: string };
  }>;
};

const doc = computed(() => JSON.parse(decodeBase64Utf8(props.docgenB64)) as Docgen);

function formatType(type: Docgen['props'][number]['type']) {
  if (!type) return '';
  if (typeof type.value === 'string') return type.value;
  return type.name ?? '';
}
</script>

<template>
  <div class="props-table">
    <div v-if="doc.description" class="description">{{ doc.description }}</div>
    <table>
      <thead>
        <tr>
          <th>Prop</th>
          <th>Type</th>
          <th>Required</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prop in doc.props" :key="prop.name">
          <td class="mono">{{ prop.name }}</td>
          <td class="mono">{{ formatType(prop.type) }}</td>
          <td>{{ prop.required ? 'yes' : 'no' }}</td>
          <td class="mono">{{ prop.defaultValue?.value ?? '' }}</td>
          <td>{{ prop.description ?? '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.props-table {
  margin: 16px 0;
  overflow-x: auto;
}
.description {
  margin-bottom: 8px;
  color: var(--vp-c-text-2);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  border: 1px solid var(--vp-c-divider);
  padding: 8px 10px;
  vertical-align: top;
}
th {
  background: var(--vp-c-bg-soft);
  text-align: left;
}
.mono {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}
</style>

