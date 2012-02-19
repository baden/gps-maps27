@echo off
path=c:\python27\;%path%

rem SET min=yes
SET min=no

rem WHITESPACE_ONLY SIMPLE_OPTIMIZATIONS ADVANCED_OPTIMIZATIONS
SET compilation_level=WHITESPACE_ONLY
rem SET compilation_level=SIMPLE_OPTIMIZATIONS

rem Идея отделить исходники от финального сервера и производить сборку перел публикацией

rem ==================
rem html
rem ==================

copy src\html\MainPage-begin.html+src\html\Tab_Map.html+src\html\Tab_Reports.html+src\html\Tab_Logs.html+src\html\Tab_Geos.html+src\html\Tab_Config.html+src\html\Tab_Help.html+src\html\MainPage-end.html build\all.html

if .%min% == .yes (
java -jar .lib\htmlcompressor-1.4.3.jar build\all.html -o build\all-min.html --compress-css --compress-js
)
goto :a
            <fileset dir="./${dir.intermediate}/" includes="${page-files}"/>
            <arg value="-jar"/>
            <arg path="./${dir.build.tools}/${tool.htmlcompressor}"/>
            <arg line="--preserve-multi-spaces"/>
            <arg line="--remove-quotes"/>
            <arg line="--compress-js"/>
            <arg line="--compress-css"/>
            <arg line="--preserve-php"/>
            <arg line="--preserve-ssi"/>
            <srcfile/>
            <arg value="-o"/>
            <mapper type="glob" from="*" to="../${dir.publish}/*"/>
            <targetfile/>
:a

rem ==================
rem css
rem ==================
echo /* generated file */>build\all.css
for %%s in (style.css tabs.css map.css reports.css logs.css geos.css config.css help.css) do (
	echo /* %%s */>>build\all.css
	type src\css\%%s>>build\all.css
)
if .%min% == .yes (
java -jar .lib\yuicompressor-2.4.7.jar build\all.css -o build\all-min.css  --type=css
)

if .%min% == .yes (
copy build\all-min.html server\www\index.html
copy build\all-min.css server\www\stylesheets\all.css
) else (
copy build\all.html server\www\index.html
copy build\all.css server\www\stylesheets\all.css
)
