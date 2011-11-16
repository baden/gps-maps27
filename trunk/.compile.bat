@echo off
path=c:\python27\;%path%

rem Идея отделить исходники от финального сервера и производить сборку перел публикацией

rem ==================
rem html
rem ==================

copy src\html\MainPage-begin.html+src\html\Tab_Map.html+src\html\Tab_Reports.html+src\html\Tab_Logs.html+src\html\Tab_Geos.html+src\html\Tab_Config.html+src\html\Tab_Help.html+src\html\MainPage-end.html build\all.html

rem ==================
rem js
rem ==================

echo /* generated file */>build\all.js
for %%s in (jquery.min-1.7.js jquery.cookie.js base.js alert.js mymarker.js lastmarker.js gmap.js alarm.js config.js geos.js zones.js directions.js maps.js reports.js logs.js) do (
	echo /* %%s */>>build\all.js
	type src\js\%%s>>build\all.js
)
rem python.exe compile.py build\all.js >build\all-min.js


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
copy build\all.css server\stylesheets\all.css
