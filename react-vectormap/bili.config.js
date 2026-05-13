import pkg from './package.json';

const isJVectorMapNextExternal = id =>
  id === 'jvectormap-next' ||
  id.startsWith('jvectormap-next/') ||
  id.includes('/jvectormap-next/');

/** @type {import('bili').Config} */
module.exports = {
  output: {
    moduleName: pkg.name,
    format: ['cjs', 'esm', 'umd', 'umd-min'],
    dir: `${__dirname}/dist`,
  },
  externals: [isJVectorMapNextExternal, 'jquery', 'react'],
};
