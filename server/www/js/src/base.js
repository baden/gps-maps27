/*
*/

//if(Modernizr) Modernizr.touch = true;		// TBD! Test touch interface

window.log = function(){
  if(window.console){
	try{
    		console.log( Array.prototype.slice.call(arguments) );
	} catch(ex) {
		log('Error in console', ex);
	}

  }
}
window.document.onselectstart = function(ev){
	//log('this', ev.target.getAttribute, ev.target.getAttribute('contenteditable'), ev.target.parentNode, ev.target.parentNode.getAttribute('contenteditable'));
	if(
		(config.tab == 1) ||
		(ev.target.getAttribute && ev.target.getAttribute('contenteditable')) ||
		(ev.target.parentNode && ev.target.parentNode.getAttribute('contenteditable')!=null)
	) {
		//log('true');
		return true;
	}
	return false;
}	// Запретим выделение (внимание решение может быть не кроссбраузерно)

//log('start base. google:', google, 'jQuery:', jQuery);

	//config.ui = {'theme': 'cupertino'};

if(('google' in window) && ('maps' in google)){
} else {
	var fileref=document.createElement('script');
	fileref.setAttribute('type', 'text/javascript');
	fileref.setAttribute('src', '/js/googlemaps/js.js');
	document.getElementsByTagName('head')[0].appendChild(fileref);
}

if(('google' in window) && ('load' in google)) {
	google.load('visualization', '1', {packages: ['corechart']});
} else {
	alert('Сервер Google недоступен. \n1. Проверьте интернет-соединение. \n2. Обновите страницу (F5).');
}

/* Загрузка темы оформления */
var theme_css = document.createElement('link');
theme_css.id = 'themecss';
theme_css.setAttribute("rel", "stylesheet");
theme_css.setAttribute("type", "text/css");
config.setTheme = function(themename) {
	theme_css.setAttribute('href', '/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/'+themename+'/jquery-ui.css');
	localStorage.setItem('account.theme', themename);
} 

var def_theme = localStorage.getItem('account.theme') || 'cupertino';
config.setTheme(def_theme);
if(!document.getElementById('themecss')) {
	var h0 = document.getElementsByTagName('head')[0];
	h0.insertBefore(theme_css, h0.firstChild);
}

config.inits.push(function(){
	log('base.js init', config);

	//$("#draggable").draggable();
	if(!window.config){
		alert('Ошибка инициализации. Проверьте интернет соединение.');
	} else {
		if(window.config.answer == 'no'){
			//alert('Heобходима авторизация');
			window.location.href = window.config.user.login_url;
			return;
		}
	}

	//if(config.account.systems.length == 0) config.skey = null; else config.skey = config.account.systems[0].skey;
	if(config.account.sys_keys.length == 0) config.skey = null; else config.skey = config.account.systems[config.account.sys_keys[0]].skey;


	/*config.sysbykey = {};
	for(var i in config.account.systems){
		var sys = config.account.systems[i];
		config.sysbykey[sys.skey] = sys;// {'imei': '{{ sys.imei }}', 'desc': '{{ sys.desc }}'};
	}*/

	/* Deprecated declares */
	//config.user = config.account.user;
	//config.username = config.account.user.nickname;
	config.admin = config.account.user.admin;
	//config.systems = config.account.systems;
	config.ui = config.account.config;
	//config.akey = config.account.key;

	console.log('Init config:', config);

	//InitUpdater();	// TBD! Это не самое элегантное решение вызова инициализации обновления.

	config.setTheme(config.account.config.theme);
	//if(!document.getElementById('themecss')) document.getElementsByTagName('head')[0].appendChild(theme_css);

	$('#a_login').attr('href', window.config.account.user.logout_url);
	$('#a_login').html(window.config.account.user.nickname);

});

var f2d = function(n) {
  if (n < 10) {
    return '0' + n;
  }
  return String(n);
}

var dt_to_Date = function(dt) {
	var date = new Date(Date.UTC(
		parseInt('20'+dt[0]+dt[1], 10),
		parseInt(dt[2]+dt[3], 10)-1,
		parseInt(dt[4]+dt[5], 10),
		parseInt(dt[6]+dt[7], 10),
		parseInt(dt[8]+dt[9], 10),
		parseInt(dt[10]+dt[11], 10)
	));
	return date;
}

var dt_to_date = function (dt) {
	var date = dt_to_Date(dt);
	return f2d(date.getDate()) + '/' + f2d(date.getMonth()+1) + '/' + date.getFullYear();
}

var dt_to_time = function (dt) {
	var date = dt_to_Date(dt);
	return date.toLocaleTimeString();
}

var dt_to_datetime = function (dt) {
	return dt_to_date(dt) + ' ' + dt_to_time(dt);
}

var Date_to_date = function(date) {
	return f2d(date.getDate()) + '/' + f2d(date.getMonth()+1) + '/' + date.getFullYear();
}

var Date_to_time = function (date) {
	return date.toLocaleTimeString();
}

var Date_to_datetime = function (date) {
	return Date_to_date(date) + ' ' + Date_to_time(date);
}

var td_to_hms = function (d) {
	var minutes = (d - (d % 60)) / 60;
	var hours = (minutes - (minutes % 60)) / 60;
	minutes = minutes % 60;
	var seconds = d % 60;
	if(hours) return hours + ' ч ' + minutes + ' мин ' + seconds + ' сек';
	else if(minutes) return minutes + ' мин ' + seconds + ' сек';
	else return seconds + ' сек';
}

var td_to_time = function (d) {
	var minutes = (d - (d % 60)) / 60;
	var hours = (minutes - (minutes % 60)) / 60;
	minutes = minutes % 60;
	var seconds = d % 60;
	var r = '';
	if(hours<10) r+='0'+hours+':'; else r+=hours+':';
	if(minutes<10) r+='0'+minutes+':'; else r+=minutes+':';
	if(seconds<10) r+='0'+seconds; else r+=seconds;
	return r;
}

//function date_to_url(ymd) {
//	return ymd.slice(8,10) + ymd.slice(3,5) + ymd.slice(0,2);
//}

var Date_to_daystart = function (d) {
	var date = new Date(d);
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	return date;
}

var Date_to_daystop = function (d) {
	var date = new Date(d);
	date.setHours(23);
	date.setMinutes(59);
	date.setSeconds(59);
	return date;
}

var Date_to_url = function (d) {
	return f2d(d.getUTCFullYear()-2000) + f2d(d.getUTCMonth()+1) + f2d(d.getUTCDate()) + 
		f2d(d.getUTCHours()) + f2d(d.getUTCMinutes()) + f2d(d.getUTCSeconds());
}

/*
	Показывает разницу между теперешним значением и указанной датой
*/
var DateDiff = function(d) {
}

var ln_to_km = function (l) {
//	var k = parseInt(l, 10);
//	var m = Math.round((l-parseInt(l, 10))*1000);
//	if(k) return Math.round(l*10)/10 + ' км (' + k + ' км ' + m + ' м)';
//	else return Math.round(l*10)/10 + ' км (' + m + ' м)';

	if(l>=1.0) return Math.round(l*10)/10 + ' км';
	else return Math.round(l*1000) + ' м';

}

/*
	Выделение компонентов адреса
*/
var geocode_to_addr = function (results) {
	var comp = {
		street_address: '',
		route: '',
		locality: '',
		sublocality: '',
		administrative_area_level_2: '',
		administrative_area_level_1: '',
		country: ''
	};
	// 'country' - страна
	// 'administrative_area_level_1' - область
	// 'administrative_area_level_2' - район (?)
	// 'sublocality' - район (?)
	// 'locality' - населенный пункт
	// 'street_address' - Дом
	// 'route' - трасса или улица при отсутствии street_address

//	for(var i in results){
	for(var i=results.length-1; i>=0; i--){
		for(var j in results[i].address_components){
			var c = results[i].address_components[j];
			comp[c.types[0]] = c.long_name;
		}
	}

	return '' +
		comp.country + ', ' +
		comp.administrative_area_level_1 + ', ' +
		((comp.locality == '')?(((comp.sublocality != '')?comp.sublocality:comp.administrative_area_level_2) + ' район, '):'') +
		((comp.locality != '')?(comp.locality+', '):'') +
		comp.route +
		(comp.street_number&&(comp.street_number != '')?(', ' + comp.street_number):'');
}

if(0){
var geocode_to_addr2 = function (results) {

	for(var i in results){
		var r = results[i];
//		console.log(r.types);
/*
Приоритет выдачи адреса:
'street_address'	Точность до улицы
'sublocality'		Точность до района
'locality'		Точность до города
results[1]		Как повезет :)
*/
		if((r.types.indexOf('street_address') != -1) ||
		   (r.types.indexOf('sublocality') != -1) ||
		   (r.types.indexOf('locality') != -1))
		{
			return r.formatted_address;
			//break;
		}
	}
	if(results[1]){
		return results[1].formatted_address;
	} else if(results[0]) {
		return results[0].formatted_address;
	}
	return 'Адрес неизвестен';
}
}


/* TBD! По возможности все перенести под function */

(function( window, $, undefined ) {


/* Расширение возможностей google.maps.* */

// Получение LatLng в виде массива [lat, lon].
google.maps.LatLng.prototype.toArray = function () {
	return [this.lat(), this.lng()];
}

// Получение LatLngBounds в виде массива [[sw_lat, sw_lon], [ne_lat, ne_lon]].
google.maps.LatLngBounds.prototype.toArray = function () {
	return [this.getSouthWest().toArray(), this.getNorthEast().toArray()];
}

// метод getBounds для Polygon и Polyline
// Оригинал тут: http://code.google.com/p/google-maps-extensions/source/browse/google.maps.Polygon.getBounds.js

if (!google.maps.Polygon.prototype.getBounds) {
	google.maps.Polygon.prototype.getBounds = function(latLng) {
		var bounds = new google.maps.LatLngBounds();
		var paths = this.getPaths();
		var path;
		for (var p = 0; p < paths.getLength(); p++) {
			path = paths.getAt(p);
			for (var i = 0; i < path.getLength(); i++) {
				bounds.extend(path.getAt(i));
			}
		}
		return bounds;
	}
}

if (!google.maps.Polyline.prototype.getBounds) {
	google.maps.Polyline.prototype.getBounds = function(latLng) {
		var bounds = new google.maps.LatLngBounds();
		var path = this.getPath();
		for (var i = 0; i < path.getLength(); i++) {
			bounds.extend(path.getAt(i));
		}
		return bounds;
	}
}

// метод contains для Polygon
// Определяет вхождение точки в полигон
// Взято отсюда: http://google-maps-extensions.googlecode.com/hg/google.maps.Polygon.contains.js
if (!google.maps.Polygon.prototype.contains) {
	google.maps.Polygon.prototype.contains = function(latLng) {
		// Outside the bounds means outside the polygon
		if (this.getBounds && !this.getBounds().contains(latLng)) {
			return false;
		}
		var lat = latLng.lat();
		var lng = latLng.lng();
		var paths = this.getPaths();
		var path, pathLength, inPath, i, j, vertex1, vertex2;
		// Walk all the paths
		for (var p = 0; p < paths.getLength(); p++) {
			path = paths.getAt(p);
			pathLength = path.getLength();
			j = pathLength - 1;
			inPath = false;
			for (i = 0; i < pathLength; i++) {
				vertex1 = path.getAt(i);
				vertex2 = path.getAt(j);
				if (vertex1.lng() < lng && vertex2.lng() >= lng || vertex2.lng() < lng && vertex1.lng() >= lng) {
					if (vertex1.lat() + (lng - vertex1.lng()) / (vertex2.lng() - vertex1.lng()) * (vertex2.lat() - vertex1.lat()) < lat) {
						inPath = !inPath;
					}
				}
				j = i;
			}
			if (inPath) {
				return true;
			}
		}
		return false;
	}
}

//var whorls = new Object();
$(document).ready(function(){

	if((document.body.clientWidth < (document.width - 8)) || (document.body.clientWidth > (document.width + 8))){
		var msg = document.createElement('div');
		msg.style.cssText = 'position: absolute; top: 30%; left: 30%; width: 30%; min-height: 30%; background: white; z-index: 2000; border: 1px solid black; border-radius: 8px; padding: 10px; box-shadow: 0px 0px 10px #404040;';
		msg.innerHTML = '<b>Масштабирование страницы не рекомендуется.<br />Это может привести к серьезному снижению производительности.</b><br /> Установите масштаб 100%.<br />Нажмите Ctrl+0 (нажмите клавишу Ctrl, и не отпуская, нажмите клавишу "ноль").';
		document.body.appendChild(msg);
		var notcare = document.createElement('button');
		notcare.style['margin-top'] = '30px';
		notcare.innerHTML = 'Да я осознаю возможные трудности и изменил масштаб умышленно.';
		msg.appendChild(notcare);
		var t = setInterval(function(){
			if((document.body.clientWidth > (document.width - 8)) && (document.body.clientWidth < (document.width + 8))){
				document.body.removeChild(msg);
				clearInterval(t);
			}
		}, 1000);
		notcare.addEventListener('click', function(){
			document.body.removeChild(msg);
			clearInterval(t);
		});

		//alert('Масштабирование страницы не рекомендуется. Используйте масштаб 100%. Закройте окно с этим сообщением и нажмите Ctrl+0 (нажмите клавишу Ctrl и не отпуская нажмите клавишу "ноль").');
	}


/*
	try { 
		whorls['timezone'] = new Date().getTimezoneOffset();
		$("#timezone").html(whorls['timezone'] + " (" + whorls['timezone']/60 + " часов)");
	} catch(ex) {
		whorls['timezone'] = "permission denied";
	}
*/
});

/*
	Динамическая иконка приложения.
*/
var favicon;
var faviconCtx;

//$(document).ready(function(){
	favicon = document.createElement('canvas'),
	faviconCtx = favicon.getContext('2d');
	favicon.width = favicon.height = 16;
//});

window.config.working = function(){
	window.config.workingdiv = window.config.workingdiv || document.getElementById('working');
	window.config.workingdiv.innerText = 'Работаем...';
	window.config.workingdiv.style.display = 'inline';

// Draw dynamic favicon
//log('faviconCtx', faviconCtx);
	faviconCtx
		.clearRect(0,0,16,16)
		.prop('fillStyle', '#a00')
		.roundRect(0, 0, 16, 16, 2)
		.fill();
	//	.drawImage(current, 0, 0, 16, 16);
	
	document.querySelector('link[rel="shortcut icon"]').setAttribute('href', favicon.toDataURL());
}

window.config.workingdone = function(title){
	//var workingdiv = document.getElementById('working');
	window.config.workingdiv = window.config.workingdiv || document.getElementById('working');
	if(title) {
		window.config.workingdiv.innerText = title;
		setTimeout(function(){log('window.config.workingdone:', title);window.config.workingdiv.style.display = 'none';}, 5000);
	} else {
		window.config.workingdiv.style.display = 'none';
	}
	faviconCtx
		.clearRect(0,0,16,16)
		.prop('fillStyle', '#0ab')
		.roundRect(0, 0, 16, 16, 2)
		.fill();
	//	.drawImage(current, 0, 0, 16, 16);
	
	document.querySelector('link[rel="shortcut icon"]').setAttribute('href', favicon.toDataURL());
}

var appCache = window.applicationCache;
// Check if a new cache is available on page load.
window.addEventListener('load', function(e) {
  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      // Swap it in and reload the page to get the new hotness.
      window.applicationCache.swapCache();
      if (confirm('Доступна новая версия сайта. Перезагрузить страницу?')) {
        window.location.reload();
      }
    } else {
      // Manifest didn't changed. Nothing new to server.
    }
  }, false);
}, false);


/*
	Всякие вспомогательные функции для избавления от jQuery.
*/
config.helper = {
	/*
		Удаляет всех наследников определенного элемента DOM
	*/
	empty: function(element){
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
	},

	/* Разделение числа на сотни, тысячи пробелом */
	digitformat: function(d) {
		return d.toString().replace(/\s+/g, '').replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
	},
	postJSON: function(url, data, callback){
		config.working();
		var formData = new FormData();
		for(k in data){
			if(typeof data[k] == "object") {
				formData.append(k, JSON.stringify(data[k]));
			} else {
				formData.append(k, data[k]);
			}
		}
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState === xhr.DONE) {
				if(xhr.status === 200 || xhr.status === 304) {
					var result = JSON.parse(xhr.responseText);
					callback(result);
					if(result.profiler){
						config.workingdone('Выполнено за ' + config.helper.digitformat(result.profiler.duration) + ' мксек');
					} else {
						config.workingdone();
					}
				} else config.workingdone();
			}
		}
		//xhr.onload = function(e) { /*log('Del log line', e);*/ };
		xhr.send(formData);
	},
	getJSON: function(url, callback){
		config.working();
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState === 4) {
				if(xhr.status === 200 || xhr.status === 304) {
					var result = JSON.parse(xhr.responseText);
					callback(result);
					if(result.profiler){
						config.workingdone('Выполнено за ' + config.helper.digitformat(result.profiler.duration) + ' мксек');
					} else {
						config.workingdone();
					}
				} else config.workingdone('Ошибка.');
			}
		}
		xhr.send(null);
	},

	dialogs: {},
	dialog: function(url, data, /*buttons,*/ ext){
		log('dialog');
		config.working();
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState === 4) {
				if(xhr.status === 200 || xhr.status === 304) {
					//callback(xhr.responseText);
					config.helper.dialogs[url] = xhr.responseText;
					var dialogsrc = config.helper.dialogs[url]
					//log();
					for(var k in data){
						dialogsrc = dialogsrc.replace('{'+k+'}', data[k]);
						//log('replace', k, data[k]);
					}
					var dialog = config.helper.element_by_html(dialogsrc);
					//log('dialog', dialog, dialogsrc, ext);
					//window['a'] = dialogsrc;
					$(dialog).dialog($.extend(ext, {
						width: 500,
						/*height: 150,*/
						modal: true,
						autoOpen: true,
						close: function(ev, ui) {
							$(this).dialog('destroy');
							document.body.removeChild(dialog);
						}/*,
						buttons: buttons*/
					}));
				}
				config.workingdone();
			}
		}
		xhr.send(null);

	}, 

/*	parseform: function(form, data) {
		for(var k=0, l=form.elements.length; k<l; k++){
			switch(form.elements[k].type) {
			case 'checkbox':
				data[form.elements[k].name] = form.elements[k].checked?'checked':'';
				break;
			default:
				data[form.elements[k].name] = form.elements[k].value;
			}
		}
	},
*/
	exdialog: function(dialog_url, api_url, ext_data, ext, callback) {
		config.helper.getJSON(api_url+'&cmd=get', function(data){
			//log('/api/system/car?get', data);
			var info = data.info;
			/*info.imei = imei;
			info.desc = desc;*/
			if(ext_data){
				for(var k in ext_data){
					info[k] = ext_data[k];
				}
			}
			log('ext=', config.helper.clone(ext));
			var b = {
				'Применить изменения.': function() {
					var form = this.querySelector('form');
					data = {};
					//config.helper.parseform(form, data);
					for(var k=0, l=form.elements.length; k<l; k++){
						switch(form.elements[k].type) {
						case 'checkbox':
							data[form.elements[k].name] = form.elements[k].checked?'checked':'';
							break;
						default:
							data[form.elements[k].name] = form.elements[k].value;
						}
					}

					log(api_url+'&cmd=set', data);
					config.helper.postJSON(api_url+'&cmd=set', data, function(data){
						//log('/api/system/car', data);
						if(callback){
							callback(data);
						}
					});
					$(this).dialog('close');
				}
			};
			if(ext.buttons) ext.buttons = $.extend(ext.buttons, b);
			else ext = $.extend(ext, {buttons: b});

			//log('ext=', config.helper.clone(ext));
			config.helper.dialog(dialog_url, info, ext);
		});
	},

	element_by_html: function(htmlString) {
		var tempDiv = document.createElement('div');
		tempDiv.insertAdjacentHTML('beforeend', htmlString);
		//log('tempDiv', htmlString, tempDiv, tempDiv.firstChild);
		//console.dir(tempDiv);
		//console.dir(tempDiv.firstChild);
		//console.dir(tempDiv.firstElementChild);
		//return (tempDiv.removeChild(tempDiv.firstChild));
		var el = tempDiv.firstElementChild;
		if(el.tagName == 'STYLE'){
			var style = tempDiv.removeChild(tempDiv.firstElementChild);
			style.setAttribute("type", "text/css");
			if(!document.getElementById(style.id)) {
				//log('style', style);
				//console.dir(style);
				document.getElementsByTagName('head')[0].appendChild(style);
			} else {
				document.getElementsByTagName('head')[0].replaceChild(style, document.getElementById(style.id));
			}
		}
		//log('->', htmlString, tempDiv);
		//console.dir(tempDiv);
		return (tempDiv.removeChild(tempDiv.firstElementChild));
		/*
		tempDiv.innerHTML = '<br>' + htmlString;
		tempDiv.removeChild(tempDiv.firstChild);
		if (tempDiv.childNodes.length == 1) {
			return (tempDiv.removeChild(tempDiv.firstChild));
		} else {
			var fragment = document.createDocumentFragment();
			while (tempDiv.firstChild) {
				fragment.appendChild(tempDiv.firstChild);
			}
			return fragment;
		}*/
	},
	tableline: function(htmlString) {
		var tr = document.createElement('tr');
		tr.innerHTML = htmlString;
		return tr;
	}
}


var clone = function(o) {
	if(!o || 'object' !== typeof o) {
		return o;
	}
	//var c = {};
	//if('function' === typeof o.pop) return o.splice(0);
	var c = ('function' === typeof o.pop) ? [] : {};
	for(var p in o) {
		if(o.hasOwnProperty(p)) {
			var v = o[p];
			if(v && 'object' === typeof v) {
				c[p] = clone(v);
			} else {
				c[p] = v;
			}
		}
	}
	return c;
}

config.helper.clone = clone;
/*
	Так вот можно выдать предупреждение при попытке закрыть страницу, перейти по другому адресу или обновить страницу (F5)
*/
/*window.onbeforeunload=function(){
	return 'Ну неужели вам не понравилось?';
}*/
var wr_tab = document.getElementById('tabs');
window.onresize = function() {
	//log('w: ', window.innerWidth, 'h:', window.innerHeight);
	wr_tab.style.height = window.innerHeight + 'px';
}
wr_tab.style.height = window.innerHeight + 'px';
window['wr_tab'] = wr_tab;

window.onbeforeprint = function(){
	log('onbeforeprint');
}
window.onafterprint = function(){
	log('onafterprint');
}

})(window, jQuery);

