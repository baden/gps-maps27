@echo off
path=c:\python27\;%path%

rem WHITESPACE_ONLY SIMPLE_OPTIMIZATIONS ADVANCED_OPTIMIZATIONS
rem SET compilation_level=WHITESPACE_ONLY
SET compilation_level=SIMPLE_OPTIMIZATIONS

rem Идея отделить исходники от финального сервера и производить сборку перел публикацией

rem ==================
rem html
rem ==================

copy src\html\MainPage-begin.html+src\html\Tab_Map.html+src\html\Tab_Reports.html+src\html\Tab_Logs.html+src\html\Tab_Geos.html+src\html\Tab_Config.html+src\html\Tab_Help.html+src\html\MainPage-end.html build\all.html

rem ==================
rem js
rem ==================

goto skip_join
echo /* generated file */>build\all.js
rem echo "use strict"; >>build\all.js
for %%s in (base.js alert.js mymarker.js lastmarker.js gmap.js alarm.js config.js geos.js zones.js directions.js maps.js reports.js logs.js) do (
	echo /* %%s */>>build\all.js
	type src\js\%%s>>build\all.js
)
rem java -jar .\.lib\compiler.jar --compilation_level=%compilation_level% --js build\all.js --js_output_file build\all-min.js --charset utf-8 2>js.errors.txt
:skip_join
SET SRC=--js src\js\base.js --js src\js\alert.js --js src\js\mymarker.js --js src\js\lastmarker.js --js src\js\gmap.js --js src\js\alarm.js --js src\js\config.js --js src\js\geos.js --js src\js\zones.js --js src\js\directions.js --js src\js\maps.js --js src\js\reports.js --js src\js\logs.js
java -jar .\.lib\compiler.jar --compilation_level=%compilation_level% %SRC% --js_output_file build\all-min.js --charset utf-8 2>js.errors.txt

rem ==================
rem css
rem ==================
echo /* generated file */>build\all.css
for %%s in (style.css tabs.css map.css reports.css logs.css geos.css config.css help.css) do (
	echo /* %%s */>>build\all.css
	type src\css\%%s>>build\all.css
)


copy build\all.html server\html\all.html
copy build\all.js server\js\all.js
copy build\all-min.js server\js\all-min.js
copy build\all.css server\stylesheets\all.css
