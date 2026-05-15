import { defineConfig } from 'vitepress';
import react from '@vitejs/plugin-react';
import { createDocsTransformPlugin } from './docs-transform.mjs';

export default defineConfig({
  title: 'jVectorMap',
  description: 'Documentation for jvectormap-next and @stadline/react-vectormap.',
  srcExclude: ['docs/**', 'node_modules/**', '**/dist/**'],
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'jvectormap-next', link: '/jvectormap-next/README' },
      { text: 'react-vectormap', link: '/react-vectormap/src/VectorMap' },
    ],
    sidebar: [
      {
        text: 'Packages',
        items: [
          { text: 'jvectormap-next', link: '/jvectormap-next/README' },
          { text: 'VectorMap', link: '/react-vectormap/src/VectorMap' },
        ],
      },
    ],
  },
  vite: {
    plugins: [createDocsTransformPlugin(), react()],
  },
});
