"use strict";
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};


function useAsyncFS(fs) {
  // see getAsText example in [FILE-API].
  var al = fs.root.getFile("already_there.txt", {create: true}, function (f) {
	log('getFile already_there.txt', f);
    getAsText(f.file());
  });

  // But now we can also write to the file; see [FILE-WRITER].
  fs.root.getFile("logFile", {create: true}, function (f) {
	log('getFile logFile', f);
    f.createWriter(writeDataToLogFile);
  });
  log('useAsyncFS', fs, al);
}


// TEMPORARY
// PERSISTENT

requestFileSystem(TEMPORARY, 1024 * 1024, function(fs) {
  useAsyncFS(fs);
});

requestFileSystem(PERSISTENT, 1024 * 1024, function(fs) {
  useAsyncFS(fs);
});


// In a worker:
if(0){
	var tempFS = requestFileSystem(TEMPORARY, 1024 * 1024);
	var logFile = tempFS.root.getFile("logFile", {create: true});
	var writer = logFile.createWriter();
	writer.seek(writer.length);
	writeDataToLogFile(writer);
}
