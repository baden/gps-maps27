@echo off
rem #!/bin/sh

path=c:\python27

for /F %%i in (list.txt) do (
	echo %%i
	if .%%i == .break goto :EOF
	python ./bribge.py %%i
rem >nul 2>nul
)

goto :EOF
rem killall bribge.py >/dev/null 2>&1

rem 356895035359317 Omega-Caravan AE1829BE
rem python ./bribge.py 356895035359317 >nul 2>nul
rem python ./bribge.py 861785000594014 >nul 2>nul

python ./bribge.py 353358016951159

