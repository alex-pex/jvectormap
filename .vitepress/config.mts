import { defineConfig } from 'vitepress';
import react from '@vitejs/plugin-react';
import { jsxLivePlugin } from './plugins/jsxLive';
import { propsTablePlugin } from './plugins/propsTable';

export default defineConfig({
  title: 'jVectorMap',
  description: 'Vector maps for the web (jQuery + React)',
  outDir: 'docs',
  markdown: {
    config(md) {
      md.use(jsxLivePlugin);
      md.use(propsTablePlugin);
    },
  },
  vite: {
    plugins: [react()],
    build: {
      emptyOutDir: true,
    },
  },
});
