@echo off
path=C:\Python27;;%PATH%
set pyscript=C:\Python27\Scripts

for %%s in (test plan) do (
python %pyscript%\markdown2.py --encoding=utf-8 %%s.md >%%s.html
)

rem python %pyscript%\markdown2.py --help


