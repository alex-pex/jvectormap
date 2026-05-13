import React, { useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import addVectorMap from 'jvectormap-next';
import 'jvectormap-next/jquery-jvectormap.css';

// Temporary compatibility bridge while jvectormap-next and jvectormap-content
// still expect a browser-global jQuery object.
window.jQuery = $;

if ($.fn.vectorMap === undefined) {
  // Bind jVectorMap and jQuery
  addVectorMap($);
}

function VectorMapAdapter({ style: containerStyle, className, ...props }) {
  /**
   * update props ref
   */
  const propsRef = useRef();
  propsRef.current = props;

  /**
   * generate the map
   */
  const nodeRef = useRef(null);
  const mapObjectRef = useRef(null);

  useEffect(() => {
    const $node = $(nodeRef.current);

    // rewrite callbacks to always be synced with props
    const callbacks = [
      'onRegionTipShow',
      'onRegionOver',
      'onRegionOut',
      'onRegionClick',
      'onRegionSelected',
      'onMarkerTipShow',
      'onMarkerOver',
      'onMarkerOut',
      'onMarkerClick',
      'onMarkerSelected',
      'onViewportChange',
    ].reduce((callbackProps, name) => {
      const callback = (...args) => {
        if (propsRef.current[name]) propsRef.current[name](...args);
      };

      return { ...callbackProps, [name]: callback };
    }, {});

    $node.vectorMap({ ...propsRef.current, ...callbacks });
    mapObjectRef.current = $node.vectorMap('get', 'mapObject');
  }, []);

  /**
   * update map based on props
   */
  useEffect(
    () => {
      if (props.series && props.series.markers) {
        props.series.markers.forEach((serie, index) => {
          mapObjectRef.current.series.markers[index].clear();
          mapObjectRef.current.series.markers[index].setValues(serie.values);
        });
      }
      if (props.series && props.series.regions) {
        props.series.regions.forEach((serie, index) => {
          mapObjectRef.current.series.regions[index].clear();
          mapObjectRef.current.series.regions[index].setValues(serie.values);
        });
      }
    },
    [props.series]
  );

  useEffect(
    () => {
      if (mapObjectRef.current.getSelectedMarkers() !== props.selectedMarkers) {
        mapObjectRef.current.clearSelectedMarkers();
        mapObjectRef.current.setSelectedMarkers(props.selectedMarkers);
      }
    },
    [props.selectedMarkers]
  );

  useEffect(
    () => {
      if (mapObjectRef.current.getSelectedRegions() !== props.selectedRegions) {
        mapObjectRef.current.clearSelectedRegions();
        mapObjectRef.current.setSelectedRegions(props.selectedRegions);
      }
    },
    [props.selectedRegions]
  );

  useEffect(
    () => {
      if (props.focusOn === undefined) return;

      if (typeof props.focusOn === 'string') {
        mapObjectRef.current.setFocus({ region: props.focusOn });
      } else {
        mapObjectRef.current.setFocus(props.focusOn);
      }
    },
    [props.focusOn]
  );

  /**
   * render
   */
  const style = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      // append inline style if exists
      ...containerStyle,
    }),
    [containerStyle]
  );

  return <div ref={nodeRef} style={style} className={className} />;
}

VectorMapAdapter.propTypes = {
  /* div props */
  style: PropTypes.object,
  className: PropTypes.string,
  /* map props */
  map: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string,
  zoomOnScroll: PropTypes.bool,
  zoomOnScrollSpeed: PropTypes.number,
  panOnDrag: PropTypes.bool,
  zoomMax: PropTypes.number,
  zoomMin: PropTypes.number,
  zoomStep: PropTypes.number,
  zoomAnimate: PropTypes.bool,
  zoomButtons: PropTypes.bool,
  bindTouchEvents: PropTypes.bool,
  regionsSelectable: PropTypes.bool,
  regionsSelectableOne: PropTypes.bool,
  markersSelectable: PropTypes.bool,
  markersSelectableOne: PropTypes.bool,
  regionMargin: PropTypes.number,
  regionStyle: PropTypes.object,
  regionLabelStyle: PropTypes.object,
  markerStyle: PropTypes.object,
  markerLabelStyle: PropTypes.object,
  markers: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  series: PropTypes.object,
  focusOn: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  labels: PropTypes.object,
  selectedRegions: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  selectedMarkers: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  onRegionTipShow: PropTypes.func,
  onRegionOver: PropTypes.func,
  onRegionOut: PropTypes.func,
  onRegionClick: PropTypes.func,
  onRegionSelected: PropTypes.func,
  onMarkerTipShow: PropTypes.func,
  onMarkerOver: PropTypes.func,
  onMarkerOut: PropTypes.func,
  onMarkerClick: PropTypes.func,
  onMarkerSelected: PropTypes.func,
  onViewportChange: PropTypes.func,
};

VectorMapAdapter.defaultProps = {
  /* div props */
  style: {},
  /* map props */
  backgroundColor: 'transparent',
  selectedMarkers: [],
  selectedRegions: [],
  regionStyle: {
    initial: {
      fill: '#777',
    },
  },
};

export default React.memo(VectorMapAdapter);
