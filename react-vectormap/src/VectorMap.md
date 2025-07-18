You can either load a static map ahead of time:

```js
// src/main.js

const { addMap } = require('@stadline/react-vectormap');
addMap('france', require('jvectormap-content/fr_regions_2016-mill.js'));

// src/components/France.jsx

<div style={{ height: 500 }}>
  <VectorMap map="france" />
</div>
```

Or you can skip adding the map and provide the content directly (useful when generating the map on the fly):

```js
// src/components/GymSteppers.jsx

const mapContent = require('./maps/custom.js').default;
initialState = { count: 1 };

<>
  <button onClick={() => setState({ count: state.count < 15 ? state.count + 1 : 1 })}>
    Stepper #{state.count} is selected.
  </button>

  <div style={{ height: 500 }}>
    <VectorMap
      mapContent={mapContent}
      selectedRegions={'step' + state.count}
      className={'map-' + state.count}
    />
  </div>
</>
```

## BREAKING CHANGE

Since v0.2.0, the `CustomVectorMap` and `VectorMap` components have been merged into a single implementation. `jvectormap-content` is no longer installed automatically; it is now the responsibility of the project to load standard maps.

`jvectormap-content` can be a large dependency, especially if you only use custom maps or a single specific map.
