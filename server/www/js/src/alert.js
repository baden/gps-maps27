/**
	* HabraAlert 0.2
	* author DeerUA
	* version 0.2.0 01.12.2009
	* license as-is PL
	* include <script type="text/javascript" scr="alert.js"></script> after <body> or before, as u wish
	*/

(function(window){

var document = window.document;

var initHA = function() {
	var is_ie6 = (window.external && typeof window.XMLHttpRequest == "undefined");
	var styles = "div#messages{position:fixed;top:0px;right:0px;width:250px;margin:0px;padding:0px;background:transparent;z-index:1000}"+
	"div#messages div{cursor: pointer;color:#fff;padding:7px;margin-bottom:7px;-moz-border-radius:5px;-webkit-border-radius:5px;-khtml-border-radius:5px;opacity:0.75;background:#888;font: normal 12px 'Georgia'}"+
	"div#messages div.error{background:#98001b}	div#messages div.message{background:#0d8529}div#messages div.warning{background:#dd6; color:#333}";
	var iestyles = "body{position:relative}div#messages{position:absolute; -ms-filter:'progid:DXImageTransform.Microsoft.Alpha(Opacity=75)'; filter: alpha(opacity=75)}div#messages div{cursor: hand}";

	var addLoadEvent = function(func) {
		var oldonload = window.onload;
		if (typeof window.onload != 'function') {
			window.onload = func;
		} else {
			window.onload = function() {
				if (oldonload) {
					oldonload();
				}
				func();
			}
		}
	}
	
	var import_style = function(src){ 
		if ((src == null || src == undefined)) return;
		var imprt = document.createElement('style');
		imprt.setAttribute("type", "text/css");
		if (imprt.styleSheet) imprt.styleSheet.cssText = src;
		else imprt.appendChild(document.createTextNode(src));
		document.getElementsByTagName('head')[0].appendChild(imprt);
	}
	
	var addAll = function() {
		var messageBox = document.createElement('div');
		messageBox.id = "messages";
		if (document.body.firstChild) document.body.insertBefore(messageBox, document.body.firstChild);
		else document.body.appendChild(messageBox);
		import_style(styles);
		if (is_ie6) import_style(iestyles);
	}	
	
	//if (document.body == null) return addLoadEvent(function() {addAll();}); 
	addAll();
}

initHA();

var message = function (mtext, mtype, howlong) {

	var mtype = mtype || 'message';
	var howlong = howlong || 8000;

	if (document.getElementById('messages') == null) {
		setTimeout(function(){message (mtext, mtype, howlong)}, 100);
		return;
	}

	var alarm = document.createElement ('div');
	alarm.className = mtype;
	alarm.innerHTML = mtext;
	
	alarm.onclick = function () {
		alarm.style.display = "none";
	};

	alarm.del = function () {
		document.getElementById('messages').removeChild (alarm);
	};
	
	document.getElementById('messages').appendChild (alarm);
	setTimeout (alarm.del, howlong);
}

/*
error = function (mtext, howlong) {
	var howlong = howlong || 20000;
	message(mtext,"error",howlong);
}

warning = function (mtext, howlong) {
	var howlong = howlong || 10000;
	message(mtext,"warning",howlong);
}
*/

/*
Использование:
<script type="text/javascript">
	m1 = function(){message("all good");}
	m3 = function(){error("something wrong");}
	m2 = function(){warning("attention");}
	m1();m3();m2();
</script>
*/

//console.log('Message: define');
window['message'] = message;

})(window);
