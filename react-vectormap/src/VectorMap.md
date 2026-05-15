You can either load a static map ahead of time:

```jsx live
import VectorMap from './VectorMap.js'
import EnsureWorldMap from './examples/EnsureWorldMap.js'

<>
  <EnsureWorldMap />
<div style={{ height: 500 }}>
    <VectorMap map="world_mill" backgroundColor="#eee" />
</div>
 </>
```

Or you can skip adding the map and provide the content directly (useful when generating the map on the fly):

```jsx live
import GymSteppersExample from './examples/GymSteppersExample.js'

<GymSteppersExample />
```

## BREAKING CHANGE

Since v0.2.0, the `CustomVectorMap` and `VectorMap` components have been merged into a single implementation. `jvectormap-content` is no longer installed automatically; it is now the responsibility of the project to load standard maps.

`jvectormap-content` can be a large dependency, especially if you only use custom maps or a single specific map.
