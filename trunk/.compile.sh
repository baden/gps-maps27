#!/bin/sh

cat src/html/MainPage-begin.html src/html/Tab_Map.html src/html/Tab_Reports.html src/html/Tab_Logs.html src/html/Tab_Geos.html src/html/Tab_Config.html src/html/Tab_Help.html src/html/MainPage-end.html>build/all.html


echo "/* generated file */">build/all.css
for s in style.css tabs.css map.css reports.css logs.css geos.css config.css help.css
do
	echo file:$s
	echo "/* $s */">>build/all.css
	cat src/css/$s>>build/all.css
done

cp build/all.html server/html/all.html
cp build/all.css server/stylesheets/all.css
