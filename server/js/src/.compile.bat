@echo off
path=c:\python27\;%path%

rem WHITESPACE_ONLY SIMPLE_OPTIMIZATIONS ADVANCED_OPTIMIZATIONS
rem SET compilation_level=WHITESPACE_ONLY
SET compilation_level=SIMPLE_OPTIMIZATIONS

rem ==================
rem js
rem ==================

SET SRC=--js base.js --js updater.js --js alert.js --js syslist.js --js mymarker.js --js lastmarker.js --js gmap.js --js alarm.js --js config.js --js geos.js --js zones.js --js directions.js --js maps.js --js reports.js --js logs.js --js post.js
java -jar ..\..\..\.lib\compiler\compiler.jar --compilation_level=%compilation_level% %SRC% --js_output_file ..\all-min.js --charset utf-8
