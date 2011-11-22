rem @echo off
rem start dev_appserver.py --port=80 --debug --clear_datastore gps-maps/
rem dev_appserver.py --port=80 --debug --use_sqlite --datastore_path=./gps-maps_datastore ../gps-maps/
path=c:\python27\;%path%
set gae=C:\Program Files\Google\google_appengine
python.exe "%gae%\dev_appserver.py" --port=80 --debug --datastore_path=./gps-maps27_datastore ./server/

rem C:\Python26\pythonw.exe "C:\Program Files\Google\google_appengine\dev_appserver.py" --admin_console_server= --port=80 --datastore_path=E:\temp\google_appengine\gps-maps_datastore D:\\Work\\MAIN\\GPS\\GGT-200\\SRC\\SITE\\googleapp\\gps-maps

rem dev_appserver.py --port=80 --address=192.168.1.2 gps-maps/
rem dev_appserver.py --port=80 --address=192.168.56.1 gps-maps/
