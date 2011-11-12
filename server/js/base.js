"use strict";

window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
//  if(this.console){
  if(window.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};

// catch all document.write() calls
(function(doc){
  var write = doc.write;
  doc.write = function(q){ 
    log('document.write(): ',arguments); 
    if (/docwriteregexwhitelist/.test(q)) write.apply(doc,arguments);  
  };
})(document);
