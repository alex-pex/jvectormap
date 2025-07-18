import React, { useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import VectorMapAdapter from './VectorMapAdapter';

export function addMap(mapName, mapContent) {
  $.fn.vectorMap('addMap', mapName, mapContent);
}

function VectorMap({ mapContent, ...props }) {
  /**
   * load required map
   */
  useLayoutEffect(
    () => {
      if (mapContent) addMap(props.map, mapContent)
    },
    [props.map, mapContent]
  );

  return <VectorMapAdapter {...props} />;
}

VectorMap.propTypes = {
  ...VectorMapAdapter.propTypes,
  mapContent: PropTypes.exact({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    paths: PropTypes.objectOf(
      PropTypes.shape({
        path: PropTypes.string.isRequired,
      })
    ).isRequired,
  }),
};

VectorMap.defaultProps = {
  map: 'custom',
};

export default React.memo(VectorMap);
