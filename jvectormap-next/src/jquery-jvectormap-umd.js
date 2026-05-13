import jvm from './jvectormap.js';
import createJVectorMap from './index.js';

if (typeof globalThis !== 'undefined') {
  globalThis.jvm = jvm;
} else if (typeof window !== 'undefined') {
  window.jvm = jvm;
}

const globalJQuery = typeof globalThis !== 'undefined'
  ? globalThis.jQuery
  : typeof window !== 'undefined'
    ? window.jQuery
    : typeof jQuery !== 'undefined'
      ? jQuery
      : undefined;

if (typeof globalJQuery === 'function' && globalJQuery.fn) {
  createJVectorMap(globalJQuery);
}

export default createJVectorMap;
