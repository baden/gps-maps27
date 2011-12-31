SET curl=D:\Programs\Git\bin\curl.exe
SET svn=D:\Programs\mingw\svn-win32-1.6.2\bin\svn.exe

rem %curl% http://closure-compiler.googlecode.com/files/compiler-latest.zip --output compiler.jar

rem exit

rem jquery-1.4.4.js
for %%i in (jquery-1.7.js, google_loader_api.js, webkit_console.js, json.js, maps/google_maps_api_v3_7.js) do (
%curl% http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/%%i --output externals\%%i
)

rem %svn% checkout http://closure-compiler.googlecode.com/svn/trunk/contrib/externs externals
