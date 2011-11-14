@echo off

SET curl=D:\Programs\Git\bin\curl.exe
SET grep=D:\Programs\Git\bin\grep.exe
SET sed=D:\Programs\Git\bin\sed.exe

%curl% -s http://maps.google.com/maps/api/js?sensor=false --output js.js.tmp

md "cb/mod_cb_scout"

for %%i in (openhand_8_8.cur,closedhand_8_8.cur,szc3d.png,cb_scout_sprite_api_002.png,mapcontrols3d6.png,transparent.png,iphone-dialog-bg.png,iphone-dialog-button.png,mapcontrols3d6.png,poweredby.png,iw_close.gif,iws3.png,cb/mod_cb_scout/cb_scout_sprite_api_002.png,cb/target_locking.gif,iw3.png,iws3.png,iw_close.gif) do (
	echo File: %%i
	%curl% -s http://maps.gstatic.com/intl/ru_ru/mapfiles/%%i --output %%i
)

%grep% -e 'getScript.*api' js.js.tmp | %sed% 's/.*mapfiles\///' | %sed% 's/\/main.*//' >api.txt

for /F %%a in (api.txt) do (
  echo API: %%a
  md "%%a"
  rem exit
  %curl% -s http://maps.gstatic.com/intl/ru_ru/mapfiles/%%a/main.js -o "%%a/main.js"
  for %%i in (common,util,controls,map,overlay,marker,geocoder,infowindow,onion,poly,stats,streetview) do (
	echo File: %%i
	%curl% -s http://maps.gstatic.com/cat_js/intl/ru_ru/mapfiles/%%a/%%7B%%i%%7D.js --output "%%a/%%i.js"
  )
)

%sed% 's/http:\/\/maps.gstatic.com\/intl\/en_us\/mapfiles/\/js\/googlemaps/g' js.js.tmp >js.js
del js.js.tmp
del api.txt




