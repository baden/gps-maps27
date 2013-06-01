@echo off
path=C:\Python27;%PATH%
rem appcfg.py --email=baden.i.ua@gmail.com update ./server/
appcfg.py --oauth2 update ./server/

rem appcfg.py --email=baden.i.ua@gmail.com rollback ./server/
