#!/bin/sh

#rem WHITESPACE_ONLY SIMPLE_OPTIMIZATIONS ADVANCED_OPTIMIZATIONS
# compilation_level=WHITESPACE_ONLY
compilation_level=SIMPLE_OPTIMIZATIONS

cat src/html/MainPage-begin.html src/html/Tab_Map.html src/html/Tab_Reports.html src/html/Tab_Logs.html src/html/Tab_Geos.html src/html/Tab_Config.html src/html/Tab_Help.html src/html/MainPage-end.html>build/all.html


# java -jar .\.lib\compiler.jar --compilation_level=%compilation_level% --js build\all.js --js_output_file build\all-min.js --charset utf-8 2>js.errors.txt
SRC=--js src/js/base.js --js src/js/alert.js --js src/js/mymarker.js --js src/js/lastmarker.js --js src/js/gmap.js --js src/js/alarm.js --js src/js/config.js --js src/js/geos.js --js src/js/zones.js --js src/js/directions.js --js src/js/maps.js --js src/js/reports.js --js src/js/logs.js
java -jar ./.lib/compiler.jar --compilation_level=$compilation_level $SRC --js_output_file build/all-min.js --charset utf-8 2>./js.errors.txt

exit

echo /* generated file */>build/all.css
for %%s in (style.css tabs.css map.css reports.css logs.css geos.css config.css help.css) do (
	echo /* %%s */>>build/all.css
	cat src/css/%%s>>build/all.css
)


cp build/all.html server/html/all.html
cp build/all.js server/js/all.js
cp build/all-min.js server/js/all-min.js
cp build/all.css server/stylesheets/all.css
