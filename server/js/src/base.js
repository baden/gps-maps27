/*
*/

window.log = function(){
  if(window.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
}

window.document.onselectstart = function(){return false;}	// Запретим выделение (внимание решение может быть не кроссбраузерно)

// catch all document.write() calls
/*(function(doc){
  var write = doc.write;
  doc.write = function(q){ 
    log('document.write(): ',arguments); 
    if (/docwriteregexwhitelist/.test(q)) write.apply(doc,arguments);  
  }
})(document);*/
/*
window._id = function(id, where) {
	return (where || (window.document)).getElementById(id);
}

window._tag = function(tag, where) {
	return (where || (window.document)).getElementsByTagName(tag);
}*/


/* Загрузка темы оформления */
var theme_css = document.createElement('link');
theme_css.id = 'themecss';
theme_css.setAttribute("rel", "stylesheet");
theme_css.setAttribute("type", "text/css");
//theme_css.className = 'alertmsg';
config.setTheme = function(themename) {
	//log('load-theme', themename, theme_css);
	/*
	if(theme_css.styleSheet) {
		theme_css.styleSheet.cssText = '/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/'+themename+'/jquery-ui.css';
	} else {
		theme_css.appendChild(document.createTextNode('/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/'+themename+'/jquery-ui.css'));
	}
	*/
	theme_css.setAttribute('href', '/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/'+themename+'/jquery-ui.css');
} 
//$(document).ready(function(){
	config.setTheme(config.account.config.theme);
	//if(!document.getElementById('themecss')) document.getElementsByTagName('head')[0].appendChild(theme_css);
	if(!document.getElementById('themecss')) {
		var h0 = document.getElementsByTagName('head')[0];
		h0.insertBefore(theme_css, h0.firstChild);
	}
//});

//  <link href="" rel="stylesheet">


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

	for(var i in results){
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

	$('#a_login').attr('href', window.config.account.user.logout_url);
	$('#a_login').html(window.config.account.user.nickname);

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
	var workingdiv = document.getElementById('working');
	workingdiv.style.display = 'inline';

// Draw dynamic favicon
//log('faviconCtx', faviconCtx);
	faviconCtx
		.clearRect(0,0,16,16)
		.prop('fillStyle', '#0a0')
		.roundRect(0, 0, 16, 16, 2)
		.fill();
	//	.drawImage(current, 0, 0, 16, 16);
	
	document.querySelector('link[rel="shortcut icon"]').setAttribute('href', favicon.toDataURL());
}

window.config.workingdone = function(){
	var workingdiv = document.getElementById('working');
	workingdiv.style.display = 'none';
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
					callback(JSON.parse(xhr.responseText));
				}
				config.workingdone();
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
					callback(JSON.parse(xhr.responseText));
				}
				config.workingdone();
			}
		}
		xhr.send(null);
	}

}

config.helper.element_by_html = function(htmlString) {
	var tempDiv = document.createElement('div');
	tempDiv.innerHTML = '<br>' + htmlString;
	tempDiv.removeChild(tempDiv.firstChild);
	if (tempDiv.childNodes.length == 1) {
		return (tempDiv.removeChild(tempDiv.firstChild));
	} else {
		var fragment = doc.createDocumentFragment();
		while (tempDiv.firstChild) {
			fragment.appendChild(tempDiv.firstChild);
		}
		return fragment;
	}
}



})(window, jQuery);

