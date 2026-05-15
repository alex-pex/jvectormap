import React, { useEffect } from 'react';
import worldMill from '../../../jvectormap-content/esm/world-mill.js';
import { addMap } from '../VectorMap';

function EnsureWorldMap() {
  useEffect(() => {
    addMap('world_mill', worldMill);
  }, []);

  return null;
}

export default React.memo(EnsureWorldMap);
