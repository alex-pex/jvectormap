import React, { useState } from 'react';
import VectorMap from '../VectorMap';
import mapContent from '../maps/custom';

function GymSteppersExample() {
  const [count, setCount] = useState(1);

  return (
    <>
      <button onClick={() => setCount(currentCount => (currentCount < 15 ? currentCount + 1 : 1))}>
        Stepper #{count} is selected.
      </button>

      <div style={{ height: 500, marginTop: 16 }}>
        <VectorMap
          mapContent={mapContent}
          selectedRegions={`step${count}`}
          className={`map-${count}`}
        />
      </div>
    </>
  );
}

export default React.memo(GymSteppersExample);
