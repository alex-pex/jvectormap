import mousewheelFactory from '../lib/jquery-mousewheel.js';
import jvm from './jvectormap.js';

function installMouseWheelPlugin($) {
  if ($.event.special.mousewheel) {
    return $.event.special.mousewheel;
  }

  if (typeof mousewheelFactory !== 'function') {
    throw new Error('jvectormap-next could not initialize jquery-mousewheel.');
  }

  mousewheelFactory($);

  return $.event.special.mousewheel;
}

export default function createJVectorMap(jQueryInstance) {
  if (!jQueryInstance || !jQueryInstance.fn) {
    throw new Error('jvectormap-next requires a jQuery instance with a fn prototype.');
  }

  if (jQueryInstance.fn.vectorMap) {
    return jQueryInstance.fn.vectorMap;
  }

  installMouseWheelPlugin(jQueryInstance);

  jvm.$ = jQueryInstance;

  var apiParams = {
        set: {
          colors: 1,
          values: 1,
          backgroundColor: 1,
          scaleColors: 1,
          normalizeFunction: 1,
          focus: 1
        },
        get: {
          selectedRegions: 1,
          selectedMarkers: 1,
          mapObject: 1,
          regionName: 1
        }
      };

  jQueryInstance.fn.vectorMap = function(options) {
    var map,
        methodName,
        map = this.children('.jvectormap-container').data('mapObject');

    if (options === 'addMap') {
      jvm.Map.maps[arguments[1]] = arguments[2];
    } else if ((options === 'set' || options === 'get') && apiParams[options][arguments[1]]) {
      methodName = arguments[1].charAt(0).toUpperCase() + arguments[1].substr(1);
      return map[options + methodName].apply(map, Array.prototype.slice.call(arguments, 2));
    } else {
      options = options || {};
      options.container = this;
      map = new jvm.Map(options);
    }

    return this;
  };

  return jQueryInstance.fn.vectorMap;
}
