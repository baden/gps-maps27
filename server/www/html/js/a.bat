
java -jar .\.lib\compiler.jar --js logs.js --js_output_file logs-min.js --charset utf-8



exit

java -jar .\.lib\compiler.jar --js logs.js --js_output_file logs-min.js --process_closure_primitives true --charset utf-8 2>1.1

python.exe compile.py logs.js >logs-min-p.js
cscript.exe .\.lib\native2ascii.js logs-min-p.js logs-min.js


python.exe .\.lib\compile.py logs.js >logs-min.js

rem python.exe compile.py testing.js >testing-min.js
rem python.exe compile.py jquery-1.4.4.js >jquery-1.4.4-min.js
