try
{
	var fso, f, input, output, re, matches, last, outstream
	if(WScript.Arguments.length < 2)
		die("Command line format: cscript.exe native2ascii.js input_file output_file", 1);
	fso = WScript.CreateObject('Scripting.FileSystemObject');
	f = fso.OpenTextFile(WScript.Arguments(0), 1);
	input = f.ReadAll(), output = '';
	f.Close();
	re = /\\u([0-9a-f]{4,4})/g;
	while((matches = re.exec(input)) !== null)
	{
		output += input.substring(last, matches.index) + String.fromCharCode(parseInt(matches[1], 16));
		last = matches.lastIndex;
	}
	output += input.substring(last);
	f = WScript.CreateObject("ADODB.Stream");
	f.Type = 2;
	f.Charset = "UTF-8";
	f.Open();
	f.WriteText(output);
	f.SaveToFile(WScript.Arguments(1), 2);
	f.Close();
}
catch(e)
{
	die('Error: ' + e.description, 10);
}

function die(message, code)
{
	WScript.StdOut.WriteLine(message);
	WScript.Quit(code);
}
