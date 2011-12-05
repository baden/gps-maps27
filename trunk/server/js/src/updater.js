/*
	Механизм передачи сообщений от сервера к клиенту.
*/

(function( window, $, undefined ) {

//window.config = window.config || {};
var config = window.config;

// Система автообновления
config.updater = {}
config.updater.queue = {};

config.updater.add = function(msg, foo){
	config.updater.queue[msg] = config.updater.queue[msg] || [];
	config.updater.queue[msg].push(foo);
}

config.updater.process = function(msg){
	/*
	if(config.updater.queue[msg.msg]){
		for(var i in config.updater.queue[msg.msg]){
			config.updater.queue[msg.msg][i](msg);
		}
	}
	*/
	log('updater.process', msg);

	if(config.updater.queue[msg.msg]){
		for(var i in config.updater.queue[msg.msg]){
			config.updater.queue[msg.msg][i](msg);
		}
	}
	if(config.updater.queue['*']){
			for(var i in config.updater.queue['*']){
				config.updater.queue['*'][i](msg);
			}
		}

}

config.updater.add('*', function(msg){
	//console.log("goog.appengine.Channel: onMessage");
	//console.log(msg);
	//log('goog.appengine.Channel: onMessage:', msg);
	//connected = true;
	if(config.admin){
		//if(msg.msg) message('Получено сообщени об обновлении:<b>' + msg.msg + '</b>');
		if(msg.msg) log('Получено сообщение от сервера:<b>', msg);
	}
});

config.updater.tabs = [];

//window['Updater'] = Updater;

	// Установим chanel-соединение
	// Получим токен для установки соединения
function UpdaterInit() {
	var uuid = new Date().getTime();
	$.getJSON('/api/channel/gettoken?uuid=' + config.account.user.id + '_' + uuid, function (data) {
		if(data.token != 'disabled'){
			var token = data.token;
			log('Token goted:' + token, 'uuid='+config.account.user.id);

			var onOpened = function() {
				log('goog.appengine.Channel: onOpened ('+token+')');
				//connected = true;
			}

			var onMessage = function(m) {
				var msg = JSON.parse(m.data);
				//log('goog.appengine.Channel: onMessage', token, m.data, msg);
				//config.updater.process(msg);
				msg.map(function f(m){config.updater.process(m)});
				//config.updater.process({msg: '*'});
			}

			var onError = function() {
				log("goog.appengine.Channel: onError");
			}

			var onClose = function() {
				log("goog.appengine.Channel: onClose (TBD! Reconnect?)");
				//connected = false;
			}
			//if(window.location.hostname == 'localhost'){
			//	goog.appengine.Socket.POLLING_TIMEOUT_MS = 10000;
			//}

			var channel = new goog.appengine.Channel(token);
			var socket = channel.open();
			socket.onopen = onOpened;
			socket.onmessage = onMessage;
			socket.onerror = onError;
			socket.onclose = onClose;
		} else {
		    log('channel api is disabled');
		}
	});
}

$(document).ready(function(){
	UpdaterInit();
});

var BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;
var bb = new BlobBuilder();

bb.append("onmessage = function(e) { postMessage('msg from worker'); }");

// Obtain a blob URL reference to our worker 'file'.
// Note: window.webkitURL.createObjectURL() in Chrome 10+.
var blobURL = (window.URL || window.webkitURL).createObjectURL(bb.getBlob());
log('blobURL', blobURL);

var worker = new Worker(blobURL);
worker.onmessage = function(e) {
  // e.data == 'msg from worker'
	log('worker in main', e);
};
worker.postMessage(); // Start the worker.


})(window, jQuery);
