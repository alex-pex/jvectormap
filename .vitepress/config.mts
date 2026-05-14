import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'jVectorMap',
  description: 'Vector maps for the web (jQuery + React)',
  outDir: 'docs',
  vite: {
    build: {
      emptyOutDir: true,
    },
  },
});

