<script setup>
const props = defineProps({
  data: {
    type: String,
    required: true,
  },
});

const docData = JSON.parse(decodeURIComponent(props.data));
</script>

<template>
  <section class="react-prop-table">
    <h2>{{ docData.displayName }} props</h2>
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
        <tr v-for="prop in docData.props" :key="prop.name">
          <td><code>{{ prop.name }}</code></td>
          <td><code>{{ prop.type || '—' }}</code></td>
          <td>{{ prop.required ? 'Yes' : 'No' }}</td>
          <td><code>{{ prop.defaultValue || '—' }}</code></td>
          <td>{{ prop.description || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
