#!/bin/sh


#rem WHITESPACE_ONLY SIMPLE_OPTIMIZATIONS ADVANCED_OPTIMIZATIONS
# compilation_level=WHITESPACE_ONLY
compilation_level=SIMPLE_OPTIMIZATIONS

# java -jar .\.lib\compiler.jar --compilation_level=%compilation_level% --js build\all.js --js_output_file build\all-min.js --charset utf-8 2>js.errors.txt
#SRC=--js src/js/base.js --js src/js/alert.js --js src/js/mymarker.js --js src/js/lastmarker.js --js src/js/gmap.js --js src/js/alarm.js --js src/js/config.js --js src/js/geos.js --js src/js/zones.js --js src/js/directions.js --js src/js/maps.js --js src/js/reports.js --js src/js/logs.js
#java -jar ./.lib/compiler.jar --compilation_level=$compilation_level $SRC --js_output_file build/all-min.js --charset utf-8 2>./js.errors.txt

echo $src
java -jar ../../../.lib/compiler/compiler.jar --js base.js --js updater.js --js alert.js --js syslist.js --js mymarker.js --js lastmarker.js --js gmap.js --js alarm.js --js config.js --js geos.js --js zones.js --js directions.js --js maps.js --js reports.js --js logs.js --compilation_level=$compilation_level $SRC --js_output_file ../all-min.js --charset utf-8 2>./js.errors.txt

