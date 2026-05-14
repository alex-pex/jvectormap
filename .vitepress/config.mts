import { defineConfig } from 'vitepress';
import { jsxLivePlugin } from './plugins/jsxLive';

export default defineConfig({
  title: 'jVectorMap',
  description: 'Vector maps for the web (jQuery + React)',
  outDir: 'docs',
  markdown: {
    config(md) {
      md.use(jsxLivePlugin);
    },
  },
  vite: {
    build: {
      emptyOutDir: true,
    },
  },
});
