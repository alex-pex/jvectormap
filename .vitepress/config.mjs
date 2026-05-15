import path from 'node:path';
import { transformWithEsbuild } from 'vite';
import { defineConfig } from 'vitepress';
import react from '@vitejs/plugin-react';
import { createDocsTransformPlugin } from './docs-transform.mjs';

function transformReactWorkspaceJsx() {
  return {
    name: 'transform-react-workspace-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\/react-vectormap\/src\/.*\.js$/.test(id)) {
        return null;
      }

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'transform',
      });
    },
  };
}

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
    resolve: {
      alias: [
        {
          find: 'jvectormap-next/jquery-jvectormap.css',
          replacement: path.resolve(process.cwd(), 'jvectormap-next/jquery-jvectormap.css'),
        },
        {
          find: 'jvectormap-next',
          replacement: path.resolve(process.cwd(), 'jvectormap-next/index.esm.js'),
        },
      ],
    },
    plugins: [
      createDocsTransformPlugin(),
      transformReactWorkspaceJsx(),
      react({ include: /react-vectormap\/src\/.*\.js$/ }),
    ],
  },
});
