@echo off
path=c:\python27\;%path%

rem WHITESPACE_ONLY SIMPLE_OPTIMIZATIONS ADVANCED_OPTIMIZATIONS
SET compilation_level=WHITESPACE_ONLY
rem SET compilation_level=SIMPLE_OPTIMIZATIONS

rem Идея отделить исходники от финального сервера и производить сборку перел публикацией

rem ==================
rem html
rem ==================

copy src\html\MainPage-begin.html+src\html\Tab_Map.html+src\html\Tab_Reports.html+src\html\Tab_Logs.html+src\html\Tab_Geos.html+src\html\Tab_Config.html+src\html\Tab_Help.html+src\html\MainPage-end.html build\all.html

rem ==================
rem css
rem ==================
echo /* generated file */>build\all.css
for %%s in (style.css tabs.css map.css reports.css logs.css geos.css config.css help.css) do (
	echo /* %%s */>>build\all.css
	type src\css\%%s>>build\all.css
)


copy build\all.html server\html\all.html
copy build\all.css server\stylesheets\all.css
