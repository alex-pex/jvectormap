import pkg from './package.json';
import path from 'path';

const umdEntry = path.join(__dirname, 'src/jquery-jvectormap-umd.js');

/** @type {import('bili').Config} */
module.exports = {
  output: {
    moduleName: pkg.name,
    format: ['cjs', 'esm', 'umd', 'umd-min'],
    dir: __dirname,
    fileName: ({ format, minify }) => {
      if (format === 'cjs') {
        return 'index.cjs.js';
      }

      if (format === 'esm') {
        return 'index.esm.js';
      }

      if (format === 'umd') {
        return `jquery-jvectormap[min].js`;
      }

      return minify ? 'jquery-jvectormap.min.js' : 'jquery-jvectormap.js';
    },
  },
  externals: ['jquery'],
  extendRollupConfig: (rollupConfig) => {
    const fileName = rollupConfig.outputConfig.entryFileNames;

    if (fileName === 'jquery-jvectormap.js' || fileName === 'jquery-jvectormap.min.js') {
      rollupConfig.inputConfig.input = umdEntry;
    }

    return rollupConfig;
  },
};
