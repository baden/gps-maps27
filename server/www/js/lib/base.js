/*
	Вызывается при инициализации. Глобальные функции и переменные.
*/
define(function () {

	var base = {};

	base.init = function() {

		window.document.onselectstart = function(ev){
			if((ev.target.getAttribute && ev.target.getAttribute('contenteditable')) || (ev.target.parentNode && ev.target.parentNode.getAttribute('contenteditable')!=null)) {
				return true;
			}
			return false;
		}	// Запретим выделение (внимание решение может быть не кроссбраузерно)

		if(('google' in window) && ('maps' in google)){
		} else {
			var fileref=document.createElement('script');
			fileref.setAttribute('type', 'text/javascript');
			fileref.setAttribute('src', '/js/googlemaps/js.js');
			document.getElementsByTagName('head')[0].appendChild(fileref);
		}

/*		if(('google' in window) && ('load' in google)) {
			google.load('visualization', '1', {packages: ['corechart']});
		} else {
			alert('Сервер Google недоступен. \n1. Проверьте интернет-соединение. \n2. Обновите страницу (F5).');
		}*/

	}


	return base;

});
