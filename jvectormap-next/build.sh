#!/bin/bash

files=( \
  src/jvectormap.js \
  src/jquery-jvectormap.js \
  lib/jquery-mousewheel.js \
  src/abstract-element.js \
  src/abstract-canvas-element.js \
  src/abstract-shape-element.js \
  src/svg-element.js \
  src/svg-group-element.js \
  src/svg-canvas-element.js \
  src/svg-shape-element.js \
  src/svg-path-element.js \
  src/svg-circle-element.js \
  src/svg-image-element.js \
  src/svg-text-element.js \
  src/vml-element.js \
  src/vml-group-element.js \
  src/vml-canvas-element.js \
  src/vml-shape-element.js \
  src/vml-path-element.js \
  src/vml-circle-element.js \
  src/vector-canvas.js \
  src/simple-scale.js \
  src/ordinal-scale.js \
  src/numeric-scale.js \
  src/color-scale.js \
  src/legend.js \
  src/data-series.js \
  src/proj.js \
  src/map-object.js \
  src/region.js \
  src/marker.js \
  src/map.js \
  src/multimap.js \
)

baseDir=`dirname $0`

counter=0
while [ $counter -lt ${#files[@]} ]; do
  files[$counter]="$baseDir/${files[$counter]}"
  let counter=counter+1
done

if [ -z "$1" ]
  then
    filename=jquery-jvectormap
  else
    filename=$1
fi

if [ -a "$filename.js" ]
  then
    rm "$filename.js"
fi

cat ${files[*]} >> "$filename.js"

./node_modules/.bin/uglifyjs "$filename.js" -o "$filename.min.js" --source-map "filename='$filename.min.map'" -c
