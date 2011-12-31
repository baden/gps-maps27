/* generated file */
/* base.js */

window.log = function(){
//  log.history = log.history || [];   // store logs to an array for reference
//  log.history.push(arguments);
//  if(this.console){
  if(window.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
}

// catch all document.write() calls
/*(function(doc){
  var write = doc.write;
  doc.write = function(q){ 
    log('document.write(): ',arguments); 
    if (/docwriteregexwhitelist/.test(q)) write.apply(doc,arguments);  
  }
})(document);*/

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
		((comp.street_number != '')?(', ' + comp.street_number):'');
}


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


var config = config || {};

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
		if(msg.msg) message('Получено сообщени об обновлении:<b>' + msg.msg + '</b>');
	}
});

config.updater.tabs = [];

config.updater.add('changedesc', function(msg) {
	//log('Обработчик события для обновления списка config.systems', msg);
	for(var i in config.systems){
		if(config.systems[i].skey == msg.data.skey){
			config.systems[i].desc = msg.data.desc;
		}
	}
	if(msg.data.skey in config.sysbykey){
		config.sysbykey[msg.data.skey].desc = msg.data.desc;
	}
	//log('CONFIG==', config);
});

config.syslist = function(options){
	var list = $('#'+options.id);

	var Make_SysList = function(){
		list.empty();
		for(var i in config.systems){
			var s = config.systems[i];
			//list.append('<option imei="'+s.imei+'" value="'+s.skey+'"'+(config.skey==s.skey?' selected':'')+'>'+s.desc+'</option>');
			list.append('<option imei="'+s.imei+'" value="'+s.skey+'">'+s.desc+'</option>');
		}
	}

	Make_SysList();

	$(list).bind({
		/*click: function(ev){
			Make_SysList();
			log('click');
			},*/
		change: options.change
	});

	config.updater.add('changeslist', function(msg) {
		log('config.syslist: Update system list');
		Make_SysList();
	});

	config.updater.add('changedesc', function(msg) {
		$(list).children('option[value="'+msg.data.skey+'"]').html(msg.data.desc);
	});

}

var UpdateAccountSystemList = function() {
	if(config && config.akey)
	$.getJSON('/api/info?akey='+config.akey, function (data) {
		if(data){
			log('UpdateAccountSystemList data:', data);
			//var config = config || {};
			config.systems = [];
			config.sysbykey = {};
			for(var i in data.info.account.systems){
				var s = data.info.account.systems[i];
				config.systems.push({
					'imei': s.imei,
					'skey': s.key,
					'desc': s.desc
				});
				config.sysbykey[s.key] = {imei: s.imei, desc: s.desc};
			}

			config.updater.process({msg: 'changeslist'});
		}
	});
}

UpdateAccountSystemList();

config.updater.add('change_slist', function(msg) {
	log('BASE: Update system list');
	UpdateAccountSystemList();
});

log('root');
/* alert.js */
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
	var styles = "div#messages{position:fixed;top:0px;right:0px;width:250px;margin:0px;padding:0px;background:transparent;z-index:2}"+
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
	
	if (document.body == null) return addLoadEvent(function() {addAll();}); 
	//addAll();	
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
/* mymarker.js */
/*
	Что хочется от маркера.
	Svg-представление
	По умолчанию размер не выходящий за линию трека
	При наезде курсором несколько увеличивается в размере
*/

//var
//window.arrdiv = null;

function MyMarker(map)
{
        this.map = map;
        this.div = null;
        this.arrdiv = null;
        //this.onclick = onclick;
	this.title = null;
	this.point = null;
	this.infowindow = null;
	this.skey = null;

//	this.result = result;
//	this.index = MyMarker_globalindex;
//	MyMarker_globalindex = MyMarker_globalindex + 1;
        // Optional parameters
	this.setMap(map);
}

MyMarker.prototype = new google.maps.OverlayView();

var add_geo_row = function(label, value) {
	$('#tbl_info tbody').append('<tr><td>'+label+'</td><td><b>'+value+'</b></td></tr>');
}

var more_info = function (data){
	//$("#moreinfo").html("Ура: " + ":" + data.answer);
	$("#moreinfo").html('');
	add_geo_row('Спутники', data.point.sats);
	add_geo_row('Скорость', data.point.speed + 'км/ч');
	add_geo_row('Основное питание', data.point.vout + 'В');
	add_geo_row('Резервное питание', data.point.vin + 'В');
	add_geo_row('Тип метки', data.point.fsource);
}

/*
function dt_to_date(dt){
	return dt[4]+dt[5] + '/' + dt[2]+dt[3] + '/20' + dt[0]+dt[1] + ' ' + dt[6]+dt[7] + ':' + dt[8]+dt[9] + ':' + dt[10]+dt[11];
}
*/

MyMarker.prototype.HideInfo = function() {
	if(this.infowindow) this.infowindow.close();
}

MyMarker.prototype.Info = function() {
	//alert('Bo ' + this.point.date);
	var point = this.point;
	var skey = this.skey;
	//log("skey = ", skey);
	if(this.infowindow) this.infowindow.close();
	this.infowindow = new google.maps.InfoWindow({content:
		'<div style="width: 220px; height: 160px; border: none;"><div class="info-header">' + dt_to_datetime(point.date) + "</div>" +
		/*'Скорость: <b>' + point.speed.toFixed(1) + " км/ч" +*/
		'<table id="tbl_info" width="100%">' +
		'<tr><td>Направление:</td><td><b>' + point.angle.toFixed(0) + "°</b></td></tr>" +
		'<tr><td>Долгота:</td><td><b>' + point.lat().toFixed(5) + "</b></td></tr>" +
		'<tr><td>Широта:</td><td><b>' + point.lng().toFixed(5) + "</b></td></tr>" +
		/*'</b><br />Спутники: <b>' + results[i].sats +*/
		/*'</b><br />Питание: <b>' + vtext +*/
		/*'</b><br />Датчик 1: <b>' + results[i].in1.toFixed(3) +
		'</b><br />Датчик 2: <b>' + results[i].in2.toFixed(3) +*/
		'</table>' + 
		'<div id="moreinfo" title="Ожидайте, идет получение дополнительной информации."><center><img src="/images/loading.gif" /></center></div></div>',
		position: point
	});
	//log(" info_window = ", this.infowindow);

	//self = this;
		//$('#moreinfo').slideUp().delay(300).fadeIn();
		//$("#moreinfo").animate({left:'+=200'},2000);
		var self = this;
		$.getJSON('/api/geo/info?skey=' + skey + '&point=' + point.date, function (data) {
			//$("#progress").html("Обрабатываем...");
			//log("JSON data: " + data);
			if (data.answer && data.answer === 'ok'){
				/*this.infowindow.close();
				this.infowindow = new google.maps.InfoWindow({content:
					position: point
				});*/

				//if(!$('#tbl_info tbody')){ sleep(10); }

				if($('#tbl_info tbody')){
					$('#tbl_info tbody').ready(function(){
						//log("JSON data: jquery domready.");
						more_info(data);
					});
					//console.log("JSON data: ready on request.");
					//more_info(data);
				}/*else{
					$('#tbl_info tbody').ready(function(){
						console.log("JSON data: jquery domready.");
						more_info(data);
						}); 
				}*/
				//google.maps.event.addListener(self.infowindow, 'domready', function(){
				//	console.log("JSON data: domready");
				//	more_info(data);
				//});
			}
			/*console.log("getJSON parce");
			if (data.answer && data.points.length > 0) {
				ParcePath(data.points, data.bounds);
			}*/
		});

//	infowindow.open(map, map.getMarker(i));
	this.infowindow.open(this.map);
}

MyMarker.prototype.onAdd = function() {
	log('MyMarker.prototype.onAdd: This:', this);

	// Note: an overlay's receipt of onAdd() indicates that
	// the map's panes are now available for attaching the overlay to the map via the DOM.

	var div = document.createElement('div');
	div.marker = this;

	div.setAttribute("class", "mymarker");

	var arrdiv = document.createElement('div');
	arrdiv.setAttribute("class", "mymarker-arrow");
	div.appendChild(arrdiv);

//	div.setAttribute("class", (this.result.speed < 1.0)?"mymarker-stop":"mymarker-move");

	div.addEventListener('click', function(e){
		this.marker.Info();
	}, false);

	if(0){
	div.addEventListener('mouseover', function(e){
		arrdiv = document.getElementById("arrowdiv");
		if(arrdiv == null){
			arrdiv = document.createElement('div');
			arrdiv.setAttribute("id", "arrowdiv");
			arrdiv.setAttribute("class", "arrowdiv");
			panes.overlayMouseTarget.appendChild(arrdiv);
		}
		arrdiv.setAttribute("style", "-webkit-transform: rotate(" + this.marker.angle + "deg);z-index:-1;");

		var overlayProjection = this.marker.getProjection();

		// Retrieve the southwest and northeast coordinates of this overlay
		// in latlngs and convert them to pixels coordinates.
		// We'll use these coordinates to resize the DIV.
		//var divpx = overlayProjection.fromLatLngToDivPixel(this.marker.div.point);

		arrdiv.style.left = parseInt(this.marker.div.style.left, 10) - 13 + 'px';
		arrdiv.style.top = parseInt(this.marker.div.style.top, 10) - 13 + 'px';

		/*this.marker.arrdiv.style.display = "block";*/

		//this.marker.div.style['background-image'] = 'url(images/marker-select.png)'
		//this.marker.div.style.width = 16;
		//this.marker.div.style.height = 16;
	}, false);

	div.addEventListener('mouseout', function(e){
		arrdiv = document.getElementById("arrowdiv");
		if(arrdiv) arrdiv.style.display = "none";
		/*if(this.marker.i % 8) this.marker.arrdiv.style.display = "none";*/
	}, false);
	}

	if(0){
	var arrdiv = document.createElement('div');
	arrdiv.setAttribute("class", "arrowdiv");
	arrdiv.setAttribute("style", "-webkit-transform: rotate(" + this.angle + "deg);z-index:-1;");

	if(this.i % 8) arrdiv.style.display = "none";
	}

	this.div = div;
	this.arrdiv = arrdiv;
	//this.arrdiv = arrdiv;

	// We add an overlay to a map via one of the map's panes.
	// We'll add this overlay to the overlayImage pane.
	var panes = this.getPanes();
	this.panes = panes;
//  	panes.overlayLayer.appendChild(arrdiv);
//	panes.overlayLayer.appendChild(div);
//	panes.overlayMouseTarget.appendChild(arrdiv);
//	panes.overlayMouseTarget.appendChild(div);

//	panes.floatPane.appendChild(div);
	panes.overlayImage.appendChild(div);

}

MyMarker.prototype.setTitle = function(title) {
//	var div = this.div;
//	div.setAttribute("title", title);
	this.div.setAttribute("title", title);
	this.title = title;
}

MyMarker.prototype.setSysKey = function(skey) {
	this.skey = skey;
}

MyMarker.prototype.setPosition = function(point) {
//	log('Marker change position');
	this.point = point;
	this.arrdiv.setAttribute("style", "-webkit-transform: rotate(" + point.angle + "deg);z-index:-1;");
//	console.log('MyMarker.protorype.setPosition');
	this.setTitle(dt_to_datetime(point.date));
	this.draw();
}


MyMarker.prototype.onRemove = function() {
	this.div.removeChild(this.arrdiv);
	this.div.parentNode.removeChild(this.div);
	this.arrdiv = null;
	this.div = null;
/*
	if(this.arrdiv){
		this.arrdiv.parentNode.removeChild(this.arrdiv);
		this.arrdiv = null;
	}
*/
}

MyMarker.prototype.draw = function() {
	log('MyMarker.prototype.draw: This:', this);
/*
	if(this.point){
		// Size and position the overlay. We use a southwest and northeast
		// position of the overlay to peg it to the correct position and size.
		// We need to retrieve the projection from this overlay to do this.
		var overlayProjection = this.getProjection();

		// Retrieve the southwest and northeast coordinates of this overlay
		// in latlngs and convert them to pixels coordinates.
		// We'll use these coordinates to resize the DIV.
		var divpx = overlayProjection.fromLatLngToDivPixel(this.point);
		// var lng = overlayProjection.fromLatLngToDivPixel(this.point.lng());

		// Resize the image's DIV to fit the indicated dimensions.
		var div = this.div;
		div.style.left = divpx.x - 8 + 'px';
		div.style.top = divpx.y - 8 + 'px';
	}
*/
/*
	if(this.arrdiv){
		var arrdiv = this.arrdiv;
		arrdiv.style.left = divpx.x - 16 + 'px';
		arrdiv.style.top = divpx.y - 16 + 'px';
	}
*/
//	console.log('MyMarker.protorype.draw.');
}
/* lastmarker.js */
/*
	Что хочется от маркера.
	В идеале Svg-представление.
	Задание цвета, иконки, меню по нажатию (показать трек, послать команду системе и т.п.)
	В идеале автоматическое обновление положения объекта
*/

(function(){		// Не захламляем глобальное пространство имен временными функциями и переменными

function LastMarker(options)
{
//	this.infowindow = null;
        this.div = null;
        this.arrdiv = null;

	this.options = options;

        //this.map = options.map;
	//this.title = options.title || "";
	this.position = options.position;
	this.point = options.point;
	this.color = options.color || 'green';
	this.desc = options.desc || 'Не определено';
	this.skey = options.skey;

	this.setMap(options.map);

//	console.log('last marker at '+ options.position, this.options);
}

LastMarker.prototype = new google.maps.OverlayView();

/*
function add_geo_row(label, value) {
	$('#tbl_info tbody').append('<tr><td>'+label+'</td><td><b>'+value+'</b></td></tr>');
}

function more_info(data){
	//$("#moreinfo").html("Ура: " + ":" + data.answer);
	$("#moreinfo").html('');
	add_geo_row('Спутники', data.point.sats);
	add_geo_row('Скорость', data.point.speed + 'км/ч');
	add_geo_row('Основное питание', data.point.vout + 'В');
	add_geo_row('Резервное питание', data.point.vin + 'В');
	add_geo_row('Тип метки', data.point.fsource);
}
*/

/*
function dt_to_date(dt){
	return dt[4]+dt[5] + '/' + dt[2]+dt[3] + '/20' + dt[0]+dt[1] + ' ' + dt[6]+dt[7] + ':' + dt[8]+dt[9] + ':' + dt[10]+dt[11];
}
*/

LastMarker.prototype.Info = function() {
	if(0){
	//alert('Bo ' + this.point.date);
	var point = this.point;
	var skey = this.skey;
	/*console.*/log("skey = " + skey);
	if(this.infowindow) this.infowindow.close();
	this.infowindow = new google.maps.InfoWindow({content:
		'<div style="width: 220px; height: 220px; border: none;"><div class="info-header">' + dt_to_datetime(point.date) + "</div>" +
		/*'Скорость: <b>' + point.speed.toFixed(1) + " км/ч" +*/
		'<table id="tbl_info" width="100%">' +
		'<tr><td>Направление:</td><td><b>' + point.angle.toFixed(0) + "°</b></td></tr>" +
		'<tr><td>Долгота:</td><td><b>' + point.lat().toFixed(5) + "</b></td></tr>" +
		'<tr><td>Широта:</td><td><b>' + point.lng().toFixed(5) + "</b></td></tr>" +
		/*'</b><br />Спутники: <b>' + results[i].sats +*/
		/*'</b><br />Питание: <b>' + vtext +*/
		/*'</b><br />Датчик 1: <b>' + results[i].in1.toFixed(3) +
		'</b><br />Датчик 2: <b>' + results[i].in2.toFixed(3) +*/
		'</table>' + 
		'<div id="moreinfo" title="Ожидайте, идет получение дополнительной информации."><center><img src="/images/loading.gif" /></center></div></div>',
		position: point
	})
	//self = this;
		//$('#moreinfo').slideUp().delay(300).fadeIn();
		//$("#moreinfo").animate({left:'+=200'},2000);
		var self = this;
		$.getJSON('/api/geo/info?skey=' + skey + '&point=' + point.date, function (data) {
			//$("#progress").html("Обрабатываем...");
			/*console.*/log("JSON data: ", data);
			if (data.answer && data.answer === 'ok'){
				/*this.infowindow.close();
				this.infowindow = new google.maps.InfoWindow({content:
					position: point
				});*/

				//if(!$('#tbl_info tbody')){ sleep(10); }

				if($('#tbl_info tbody')){
					$('#tbl_info tbody').ready(function(){
						/*console.*/log("JSON data: jquery domready.");
						more_info(data);
					});
					//console.log("JSON data: ready on request.");
					//more_info(data);
				}/*else{
					$('#tbl_info tbody').ready(function(){
						console.log("JSON data: jquery domready.");
						more_info(data);
						}); 
				}*/
				//google.maps.event.addListener(self.infowindow, 'domready', function(){
				//	console.log("JSON data: domready");
				//	more_info(data);
				//});
			}
			/*console.log("getJSON parce");
			if (data.answer && data.points.length > 0) {
				ParcePath(data.points, data.bounds);
			}*/
		});

//	infowindow.open(map, map.getMarker(i));
	this.infowindow.open(map);
	}
}

var SVG = {};

// These are SVG-related namespace URLs
SVG.ns = "http://www.w3.org/2000/svg";
SVG.xlinkns = "http://www.w3.org/1999/xlink";


LastMarker.prototype.onAdd = function() {

	// Note: an overlay's receipt of onAdd() indicates that
	// the map's panes are now available for attaching the overlay to the map via the DOM.

	var div = document.createElement('div');
	div.marker = this;

	div.setAttribute("class", "lastmarker");
	div.setAttribute("title", this.options.desc + '\n' + this.point.time);
	div.setAttribute("skey", this.skey);
	//div.addEventListener('mouseover', function(e){
	//	console.log('aa');
	//});
	//div.setAttribute("onclock", "function(){console.log('aa');}");
	//div.innerHTML = '2';

	//var title = document.createElement('div');
	//title.setAttribute("class", "lastmarker-title");
	//title.setAttribute("style", "background-color:"+this.color+";");
	//div.appendChild(title);
	//title.innerHTML = '<p>'+Math.round(Math.random()*9)+'</p>';

	var label = document.createElement('div');
	label.setAttribute("class", "lastmarker-label");
	//label.innerHTML = this.car;
	label.innerHTML = this.options.desc;

/*
	var control = document.createElement('div');
	control.setAttribute("class", "lastmarker-control");
	var panel = ''
	panel += '<table><tbody>';
	panel += '<tr><td>Время</td><td>'+this.point.time+'</td></tr>';
	panel += '<tr><td>Скорость</td><td>'+this.point.speed+'</td></tr>';
	panel += '<tr><td>Осн.питание</td><td>'+this.point.vout+'</td></tr>';
	panel += '<tr><td>Рез.питание</td><td>'+this.point.vin+'</td></tr>';
	panel += '<tr><td>Спутники</td><td>'+this.point.sats+'</td></tr>';
	panel += '<tr><td>Топливо</td><td>-</td></tr>';
	//panel += '<tr><td>Рефрижератор</td><td>-</td></tr>';
	panel += '</tbody></table>';
	panel += '<button title="Послать сигнал системе.">Вызов</button>';
//	panel += '<button title="Послать сигнал системе." class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-primary" name="btn_menu" id="nav_logs" href="/s/Logs" role="button" aria-disabled="false"><span class="ui-button-icon-primary ui-icon ui-icon-alert"></span><span class="ui-button-text">Сигнал</span></button>'
	control.innerHTML = panel;
	label.appendChild(control);
	$(control).find('button').button();
	//this.control = control;
*/

	var control = document.createElement('div');
	control.setAttribute("class", "lastmarker-control");
	label.appendChild(control);


	//console.log($(control).find('button'));

	div.appendChild(label);

	//var direction = document.createElement('svg');
	var svg = document.createElementNS(SVG.ns, "svg:svg");
	svg.setAttribute("style", 'margin: -8px -8px -8px -8px');
	svg.setAttribute("width", '32px');
	svg.setAttribute("height", '32px');
	// Set the coordinates used by drawings in the canvas
	//svg.setAttribute("viewBox", '0px 0px 32px 32px');
	// Define the XLink namespace that SVG uses
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", SVG.xlinkns);

	var g = document.createElementNS(SVG.ns, "g");
	g.setAttributeNS(null, 'transform', 'translate(16,16)');

	var shape = document.createElementNS(SVG.ns, "polyline");
	shape.setAttributeNS(null, "points", "-8,-4 0,-15 8,-4");
	shape.setAttributeNS(null, "fill", "none");
	shape.setAttributeNS(null, "stroke", "black");
	shape.setAttributeNS(null, "stroke-width", "2px");
	shape.setAttributeNS(null, 'transform', 'rotate('+this.point.course+')');

	this.shape = shape;

    	g.appendChild(shape);
	svg.appendChild(g);
	div.appendChild(svg);


//	div.setAttribute("class", (this.result.speed < 1.0)?"mymarker-stop":"mymarker-move");

	div.addEventListener('click', function(e){
		log('lastmarker: click', e);
		//this.marker.Info();
	}, false);

	var me = this;
	//this.hint = false;

	//log('lastmarker: onadd', this);
	div.addEventListener('mouseover', function(e){
		//if(!me.hint){
		//me.hint = true;
		//log('lastmarker: mouseover', e, this);
		var panel = ''
		panel += '<table><tbody>';
		panel += '<tr><td>Время</td><td>' + dt_to_datetime(me.point.time)+'</td></tr>';
		panel += '<tr><td>Скорость</td><td>' + me.point.speed+'</td></tr>';
		panel += '<tr><td>Осн.питание</td><td>' + me.point.vout+'</td></tr>';
		panel += '<tr><td>Рез.питание</td><td>' + me.point.vin+'</td></tr>';
		panel += '<tr><td>Спутники</td><td>' + me.point.sats+'</td></tr>';
		panel += '<tr><td>Топливо</td><td>-</td></tr>';
		//panel += '<tr><td>Рефрижератор</td><td>-</td></tr>';
		panel += '</tbody></table>';
		//panel += '<button title="Послать сигнал системе.">Вызов</button>';
	//	panel += '<button title="Послать сигнал системе." class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-primary" name="btn_menu" id="nav_logs" href="/s/Logs" role="button" aria-disabled="false"><span class="ui-button-icon-primary ui-icon ui-icon-alert"></span><span class="ui-button-text">Сигнал</span></button>'
		control.innerHTML = panel;
		//this.label.appendChild(control);
		//this.control = control;
		//$(control).find('button').button();
		//}
	}, false);

	div.addEventListener('mouseout', function(e){
		//log('lastmarker: mouseout', e, this);
		//control.innerHTML = '';
		//me.hint = false;
		//if(this.control){
		//	this.label.removeChild(this.control);
		//}
	}, false);

	if(0){
	var arrdiv = document.createElement('div');
	arrdiv.setAttribute("class", "arrowdiv");
	arrdiv.setAttribute("style", "-webkit-transform: rotate(" + this.angle + "deg);z-index:-1;");

	if(this.i % 8) arrdiv.style.display = "none";
	}

	this.div = div;
	this.label = label;
	this.control = null;
//	this.arrdiv = arrdiv;
	//this.arrdiv = arrdiv;

	// We add an overlay to a map via one of the map's panes.
	// We'll add this overlay to the overlayImage pane.
	var panes = this.getPanes();
	this.panes = panes;
//  	panes.overlayLayer.appendChild(arrdiv);
//	panes.overlayLayer.appendChild(div);
//	panes.overlayMouseTarget.appendChild(arrdiv);
//	panes.overlayMouseTarget.appendChild(div);

//	panes.floatPane.appendChild(div);
	panes.overlayImage.appendChild(div);
//	panes.overlayImage.appendChild(label);

	//$(div).mouseover(function(){console.log('aaa');});
}

LastMarker.prototype.setPosition = function(point, position) {
//	log('Marker change position', point);
	this.position = position;
	this.point = point;
//	this.arrdiv.setAttribute("style", "-webkit-transform: rotate(" + point.angle + "deg);z-index:-1;");
//	console.log('MyMarker.protorype.setPosition');
//	this.setTitle(dt_to_datetime(point.date));
	this.draw();
}


LastMarker.prototype.onRemove = function() {
	this.div.removeChild(this.arrdiv);
	this.div.parentNode.removeChild(this.div);
	this.arrdiv = null;
	this.div = null;
/*
	if(this.arrdiv){
		this.arrdiv.parentNode.removeChild(this.arrdiv);
		this.arrdiv = null;
	}
*/
}

LastMarker.prototype.draw = function() {

	if(this.position){
		// Size and position the overlay. We use a southwest and northeast
		// position of the overlay to peg it to the correct position and size.
		// We need to retrieve the projection from this overlay to do this.
		var overlayProjection = this.getProjection();

		// Retrieve the southwest and northeast coordinates of this overlay
		// in latlngs and convert them to pixels coordinates.
		// We'll use these coordinates to resize the DIV.
		var divpx = overlayProjection.fromLatLngToDivPixel(this.position);
		// var lng = overlayProjection.fromLatLngToDivPixel(this.point.lng());

		// Resize the image's DIV to fit the indicated dimensions.
		var div = this.div;
		div.style.left = divpx.x - 8 + 'px';
		div.style.top = divpx.y - 8 + 'px';

		if(this.shape){
			this.shape.setAttributeNS(null, 'transform', 'rotate('+this.point.course+')');
		}
		//log('div g transformation', );
	}
}

window['LastMarker'] = LastMarker;	// Экспорт глобального имени

})();
/* gmap.js */
﻿(function( $, undefined ) {


//$.extend($.ui, { gmap: { version: "0.0.1" } });

var PROP_NAME = 'gmap';
//var dpuuid = new Date().getTime();

/* Google Map v3 widget.
   Use the singleton instance of this class, $.gmap, to interact with the gmap widget.
   Settings for (groups of) gmap container are maintained in an instance object,
   allowing multiple different settings on the same page. */

function GMap() {
	this.debug = false; // Change this to true to start debugging
	this._curInst = null; // The current instance in use
	this._mainDivId = 'gmap'; // The ID of the main gmap widget
	this.regional = []; // Available regional settings, indexed by language code
	this.regional[''] = { // Default regional settings
		closeText: 'Close' // Display text for close link
	}
	this._defaults = { // Global defaults for all the gmap widget instances
		pos: new google.maps.LatLng(48.5000, 34.599), // Default position
		maptype: google.maps.MapTypeId.ROADMAP,
		zoom: 10,
		marker: 'none',
		markertitme: 'Ooooops!'
	}

	this.Image_Stop = new google.maps.MarkerImage(
		'/images/marker-stop.png',
		new google.maps.Size(16, 20),
		new google.maps.Point(0, 0),
		new google.maps.Point(7, 19)
	)

	this.Image_Halt = new google.maps.MarkerImage(
		'/images/marker-halt.png',
		new google.maps.Size(16, 20),
		new google.maps.Point(0, 0),
		new google.maps.Point(7, 19)
	)

	$.extend(this._defaults, this.regional['']);
//	this.addClass = "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all";
	//this.dpDiv = $('<div id="' + this._mainDivId + '" class="ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>');
}

$.extend(GMap.prototype, {
	/* Class name added to elements to indicate already configured with a gmap widget. */
	markerClassName: 'hasGMap',
	/* Debug logging (if enabled). */
	/*log: function () {
		if (this.debug)
			console.log.apply('', arguments);
	},*/
	// TODO rename to "widget" when switching to widget factory
	_widgetGMap: function() {
		return this.dpDiv;
	},

	_getInst: function(target) {
		try {
			return $.data(target, PROP_NAME);
		}
		catch (err) {
			throw 'Missing instance data for this gmap';
		}
	},

	_setPos: function(inst, date, noChange) {
		//console.log('GMAP:setPos');
		//console.log(arguments);
	},

	_setPosGMap: function(target, pos) {
		//console.log('GMAP:setPos (' + target + ')');
		
		var inst = this._getInst(target);
		if (inst) {
			this._setPos(inst, pos);
			//console.log('inst:');
			//console.log(inst);
			//this._updateDatepicker(inst);
			//this._updateAlternate(inst);
		} else {
			//console.log('error inst');
		}
		
	},

	_destroyGMap: function(target) {
		//log('GMAP: destroy');
		var $target = $(target);
		var inst = $.data(target, PROP_NAME);
		if (!$target.hasClass(this.markerClassName)) {
			log('GMAP error: not a map');
			return;
		}
		var nodeName = target.nodeName.toLowerCase();
		$.removeData(target, PROP_NAME);
		//log($target);
		$target.removeClass(this.markerClassName).empty();
	},

	_optionGMap: function(target, name, value) {
		var inst = this._getInst(target);
		if (arguments.length == 2 && typeof name == 'string') {
			return (name == 'defaults' ? $.extend({}, $.gmap._defaults) :
				(inst ? (name == 'all' ? $.extend({}, inst.settings) :
				this._get(inst, name)) : null));
		}
	},

	_get: function(inst, name) {
		//log('GMAP: get', inst);
		return inst.settings[name] !== undefined ?
			inst.settings[name] : this._defaults[name];
	},

	_attachMap: function(target, settings) {
		var nodeName = target.nodeName.toLowerCase();
		var id = this._mainDivId = target.id;
		var divSpan = $(target);


		//console.log();
		var inst = $.data(target, PROP_NAME, $.extend({}, this._defaults, settings || {}));
		//var inst = this._newInst($(target));
		inst.settings = $.extend({}, settings || {});

		//this._dialogInst
		//var nodeName = '';
		//log('GMap:attach map to ' + nodeName + '(' + id + ') with settings:' + settings);

		var mapdiv = document.createElement('div');
		mapdiv.id = this._mainDivId + '_m';
		mapdiv.className = "map-container";
		var controldiv = document.createElement('div');
		controldiv.className = "map-control";
		controldiv.innerHTML = ''+
'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_map" value="0" name="'+this._mainDivId+'_type" checked="checked" /><label for="'+this._mainDivId+'btn_map">Карта</label>'+
'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_sat" value="1" name="'+this._mainDivId+'_type" /><label for="'+this._mainDivId+'btn_sat">Спутник</label>'+
'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_hybr" value="2" name="'+this._mainDivId+'_type" /><label for="'+this._mainDivId+'btn_hybr">Гибрид</label>'+
'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_terr" value="3" name="'+this._mainDivId+'_type" /><label for="'+this._mainDivId+'btn_terr">Рельеф</label>';
		
		divSpan.append(mapdiv);
		divSpan.append(controldiv);


		//console.log(divSpan);
		//console.log(divSpan.append('div'));
		//console.log(target);
		//console.log(settings);
		divSpan.addClass(this.markerClassName);

		//log('inst.settings = ', inst.settings);
		//console.log();

		var mapOptions = {
			center: inst.settings.pos || new google.maps.LatLng(48.5000, 34.599),
			mapTypeId: inst.settings.maptype || google.maps.MapTypeId.ROADMAP,
			mapTypeControl: false,
			scaleControl: true,
			disableDoubleClickZoom: true,
			draggableCursor: "default",
			zoom: inst.settings.zoom
		}
		//instsettings.map = new google.maps.Map(document.getElementById(this._mainDivId), mapOptions);
		//log('mapdiv == ', mapdiv);
		var map = new google.maps.Map(mapdiv, mapOptions);
		inst.settings.map = map;

		/*
		if(inst.settings.marker == 'center'){
			var marker = new google.maps.Marker({
		        	position: inst.settings.pos,
			        map: map,
				title: inst.settings.markertitme,
					//tp + td_to_hms(dt) +
					//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
					//'\n' + dstop + '...' + dstart,
				//icon: icon,
				icon: this.Image_Stop,
			        draggable: false
				//zIndex: -1000
			});
		}
		*/

		$(controldiv).buttonset();
		$(controldiv).find('input').change(function(){
			//log($(this).attr("value"));
			switch($(this).attr("value")){
				case '0': {map.setMapTypeId(google.maps.MapTypeId.ROADMAP); break }
				case '1': {map.setMapTypeId(google.maps.MapTypeId.SATELLITE); break }
				case '2': {map.setMapTypeId(google.maps.MapTypeId.HYBRID); break }
				case '3': {map.setMapTypeId(google.maps.MapTypeId.TERRAIN); break }
			}
			
		});


	}

});


$.fn.gmap = function(options){
	/* Initialise the gmap widget. */
	if (!$.gmap.initialized) {
		// Do somthing
		$.gmap.initialized = true;
		//console.log('GMap:init(' + options + ')');
	}

	/*
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (typeof options == 'string' && (options == 'isDisabled' || options == 'getDate' || options == 'widget'))
		return $.datepicker['_' + options + 'Datepicker'].
			apply($.datepicker, [this[0]].concat(otherArgs));
	if (options == 'option' && arguments.length == 2 && typeof arguments[1] == 'string')
		return $.datepicker['_' + options + 'Datepicker'].
			apply($.datepicker, [this[0]].concat(otherArgs));
	return this.each(function() {
		typeof options == 'string' ?
			$.datepicker['_' + options + 'Datepicker'].
				apply($.datepicker, [this].concat(otherArgs)) :
			$.datepicker._attachDatepicker(this, options);
	});
	*/
	
//	console.log('GMap:create');
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (options == 'option' && arguments.length == 2 && typeof arguments[1] == 'string'){
		//log('arguments==', arguments);
		return $.gmap['_' + options + 'GMap'].apply($.gmap, [this[0]].concat(otherArgs));
	}

	return this.each(function() {
		//console.log('options==');
		//console.log(options);
		//console.log('arguments==');
		//console.log(arguments);
		//console.log($.gmap['_' + options + 'GMap']);
		//console.log('_' + options + 'GMap');
		typeof options == 'string' ?
			$.gmap['_' + options + 'GMap'].apply($.gmap, [this].concat(otherArgs)) :
			$.gmap._attachMap(this, options);
	});
}

$.gmap = new GMap(); // singleton instance
$.gmap.initialized = false;
//$.gmap.uuid = new Date().getTime();
$.gmap.version = "0.0.2";

$.gmap.images = {};
$.gmap.images['start'] = new google.maps.MarkerImage(
	'/images/marker-start.png?v=1',
	new google.maps.Size(24, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(11, 19)
);

$.gmap.images['finish'] = new google.maps.MarkerImage(
	'/images/marker-finish.png?v=1',
	new google.maps.Size(28, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(14, 19)
);

$.gmap.images['begin'] = new google.maps.MarkerImage(
	'/images/marker-begin.png?v=1',
	new google.maps.Size(30, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(15, 19)
);

$.gmap.images['end'] = new google.maps.MarkerImage(
	'/images/marker-end.png?v=1',
	new google.maps.Size(30, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(15, 19)
);

$.gmap.images['stop'] = new google.maps.MarkerImage(
	'/images/marker-stop.png?v=1',
	new google.maps.Size(16, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(7, 19)
);

$.gmap.images['halt'] = new google.maps.MarkerImage(
	'/images/marker-halt.png?v=1',
	new google.maps.Size(16, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(7, 19)
);

$.gmap.images['alarm'] = new google.maps.MarkerImage(
	'/images/marker-alarm.png?v=3',
	new google.maps.Size(16, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(7, 19)
);

$.gmap.images['center'] = new google.maps.MarkerImage(
	'/images/marker-center.png?v=1',
	new google.maps.Size(32, 32),
	new google.maps.Point(0, 0),
	new google.maps.Point(15, 15)
);

// Workaround for #4055
// Add another global to avoid noConflict issues with inline event handlers
//window['DP_jQuery_' + dpuuid] = $;

})(jQuery);
/* alarm.js */
(function( $, undefined ) {



var alertcnt = 0;
var geocoder;
if('google' in window) geocoder = new google.maps.Geocoder();
//var sound;

window.config['informer'] = {};
config.updater.add('inform', function(msg) {
	log('Inform: update', msg);

	if(msg.data.skey in window.config.informer){
		var infs = window.config.informer[msg.data.skey];
		for(var i in infs){
			if(infs[i].msg == msg.data.msg){
				infs[i].callback();
				delete infs[i];		// Не совсем правильное удаление, оно не удаляет, а ставит undefined
			}
		}
	}
});

var push_informer = function(skey, msg, callback){
	if(!(skey in window.config.informer)) window.config.informer[skey] = [];
	window.config.informer[skey].push({
		'msg': msg,
		'callback': callback
	});
}

window.config['alarm'] = {};

var remove_alert_icon = function(skey){
	$('div#alert_container>span[skey="'+skey+'"]').remove();
}


var show_alarm_window = function(skey, update){
	var data = window.config.alarm[skey];

	if(update){
		var sound = new Audio();
		sound.src = 'sound/alarm.' + (sound.canPlayType('audio/ogg') ? 'ogg' : sound.canPlayType('audio/mp3') ? 'mp3' : 'wav');
		sound.play();
	}
	//console.dir(sound);

	if(update){
		data.dthistory = data.dthistory || [];
		data.dthistory.push(data.dt);
	}

	data.position = new google.maps.LatLng(data.lpos[0], data.lpos[1]);

	if($('#alarmdlg_' + skey).length > 0){
		if($(data.dialog).dialog('isOpen')){
			if(update) $(data.dialog).parent().children().first().children().first().effect('pulsate');
		} else $(data.dialog).dialog('open');
		data.map.panTo(data.position);
		data.marker.setPosition(data.position);
		
	} else {
		var messageBox = document.createElement('div');
		messageBox.id = 'alarmdlg_' + skey;
		messageBox.className = 'alertmsg';
		messageBox.innerHTML = 'Система: <b>' + window.config.sysbykey[skey].desc + '</b>'+
			'<br/>Идентификатор: <b>' + data.fid + '</b>';

		if (document.body.firstChild) document.body.insertBefore(messageBox, document.body.firstChild);
		else document.body.appendChild(messageBox);

		data.datetime = document.createElement('div');
		messageBox.appendChild(data.datetime);

		data.addres = document.createElement('div');
		messageBox.appendChild(data.addres);
		var dmap = document.createElement('div');
		dmap.id = 'alarmmap_' + String(new Date().getTime());
		dmap.className = 'alertmap';
		messageBox.appendChild(dmap);
		var $map = $(dmap).gmap({
			pos: data.position,
			zoom: 15,
			marker: 'center'
		});
		data.map = $($map).gmap('option', 'map');
		data.marker = new google.maps.Marker({
			position: data.position,
			map: data.map,
			title: 'Последнее известное положение.',
			icon: $.gmap.images['alarm'],
	       		draggable: false
		});

        	alertcnt++;

		window.config.alarm[skey].dialog = $(messageBox).dialog({
			title: '<span class="ui-icon ui-icon-alert" style="display:inline-block;"></span> <span style="color:red;">Внимание! Нажата тревожная кнопка.</span>',
			//hide: 'slide',
			//show: 'drop',
			//stack: false,
			resizable: false,
			modal: false,
			autoOpen: true,
			width: 630,
			height: 420,
			buttons:[{
				text: 'Подтверждение',
				click: function(event, ui){
					var btn = event.currentTarget;
					var cncl_btn = event.currentTarget.nextSibling;

					var dialog = this;
					log($(dialog).dialog('option', 'buttons'));
					console.dir($(dialog).dialog('option', 'buttons'));

					$(btn).button( 'option', {
						icons: {primary:'ui-icon-gear'},
						label: 'Отправка подтверждения...',
						disabled: true
					});
					$.getJSON('/api/alarm/confirm?akey='+window.config.akey+'&imei=' + config.sysbykey[skey].imei, function (data) {
						if (data.answer && data.answer === 'ok'){
							$(btn).button( 'option', {
								icons: {primary:'ui-icon-zoomin'},
								label: 'Ожидание ответа...',
								disabled: true
							});
							// Так мудрёно сделано, пипец
							// Я сильно удивлюсь если тут не будет утечки памяти
							push_informer(skey, 'ALARM_CONFIRM', function(){
								log('Inform: wait-callback done.');
								$(btn).button( 'option', {
									icons: {primary:'ui-icon-flag'},
									label: 'Подтверждено!',
									disabled: true
								});
								window.config.alarm[skey].confirmed = true;
								window.config.alarm[skey].confirmby = window.config.user.nickname;
								window.config.alarm[skey].confirmwhen = Date_to_url(new Date());
								$(cncl_btn).button('option',{disabled: false});
								add_alert_icon(skey);
								//$(dialog).dialog('option', 'buttons')['Отмена тревоги'];
							});
						}
					});
				}},{
				text: 'Отбой тревоги',
				click: function(event, ui){
					var btn = event.currentTarget;
					var conf_btn = event.currentTarget.previousSibling;

					var dialog = this;
					$(btn).button( 'option', {
						icons: {primary:'ui-icon-gear'},
						label: 'Отправка отмены...',
						disabled: true
					});
					$.getJSON('/api/alarm/cancel?akey='+window.config.akey+'&imei=' + window.config.sysbykey[skey].imei, function (data) {
						if (data.answer && data.answer === 'ok'){
							$(btn).button( 'option', {
								icons: {primary:'ui-icon-zoomin'},
								label: 'Ожидание ответа...',
								disabled: true
							});
							// Так мудрёно сделано, пипец
							// Я сильно удивлюсь если тут не будет утечки памяти
							push_informer(skey, 'ALARM_CANCEL', function(){
								log('Inform: wait-callback done.');
								$(btn).button( 'option', {
									icons: {primary:'ui-icon-flag'},
									label: 'Тревога отменена!',
									disabled: true
								});
								$(conf_btn).button('option',{disabled: true});
								remove_alert_icon(skey);
								delete window.config.alarm[skey];
								$(dialog).dialog('destroy');
								$('#alarmdlg_' + skey).remove();
							});
						}
					});
				}},{
				text: 'Центровать на большой карте',
				click: function(){
					$(this).dialog("close");

					//var handler = function() {
					//	log('The quick brown fox jumps over the lazy dog.');
					//};

					if($('#tabs').tabs( "option", "selected" ) != 0){
						$('#tabs').bind('tabsshow', function(event, ui) {
							log('binded tab show');
							config.map.panTo(data.position);
							config.map.setZoom(15);
							$('#tabs').unbind(event);
						});
						$('#tabs').tabs('select', 0);		// TBD! Если карта не открывалась еще то нужна задержка.
					} else {
						config.map.panTo(data.position);
						config.map.setZoom(15);
					}
				}}/*,
				'Закрыть': function(){
					$(this).dialog("close");
				}*/
			],
			open: function(event, ui) {
				var btns = $(this).parent().find('button');
				if(window.config.alarm[skey].confirmed){
					log('find key:', this, $(this)[0], $(this).parent().find('button'));
					$(btns[0]).button( 'option', {disabled: true});
					$(btns[1]).button( 'option', {disabled: false});
				} else {
					$(btns[1]).button( 'option', {disabled: true});
				}
				var position = $(this).dialog( "option", "position" );
				position.offset = '' + (alertcnt * 16) + ' ' + (alertcnt * 16);
				$(this).dialog( "option", "position", position );
				$(this).parent().css('border', '3px solid red');
				$(this).parent().children().first().children().first().effect('pulsate');
			},
			close: function(event, ui) {
				alertcnt--;
				if(alertcnt<0) alertcnt = 0;
			}
		});
	}

	var sp = '';
	var title='Тревога в:';
	if(data.dthistory.length > 0){
		//log(data.dthistory);
		for(var i in data.dthistory){
			title+='\r\n' + dt_to_datetime(data.dthistory[i]);
			sp += '+';
		}
		//data.datetime.title = title;
	}
	data.datetime.innerHTML = 'Время: <b>' + dt_to_datetime(data.dt) + '</b><span style="cursor: pointer;" title="'+title+'">'+sp+'</span>';

	if((data.position.lat()==0) && (data.position.lng()==0)){

		data.addres.innerHTML = 'Положение объекта неизвестно. Отсутствует сигнал GPS.  '+
		/*'<span style="display:inline-block;border:1px solid black;cursor:pointer;" spid="1" title="Показать последнее положение из базы.">LAST</span>'+*/
		'<span style="display:inline-block;border:1px solid black;cursor:pointer;border-radius:4px;" spid="2" title="Определить по вышкам сотовой связи (приблизительно)">GSM</span>';
		$(data.addres).find('span[spid="1"]').click(function(){
			log('Show last');
		});
		$(data.addres).find('span[spid="2"]').click(function(){
			log('Show GPRS', data.ceng);
			$.getJSON('/api/gmap/ceng?akey='+window.config.akey+'&ceng=' + data.ceng, function (rdata) {
				if (rdata.answer && rdata.answer === 'ok'){
					data.position = new google.maps.LatLng(rdata.loc[0], rdata.loc[1]);
					data.addres.innerHTML = 'Положение объекта по вышкам GSM: ' + rdata.loc;
					//data.addres.title = rdata.geo;
					data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно

					if(geocoder) geocoder.geocode({'latLng': data.position}, function(results, status) {
	      					if (status == google.maps.GeocoderStatus.OK) {
							var address = geocode_to_addr(results);
	  						//console.log(results);

							data.addres.innerHTML = 'Адрес: <b>' + address + '</b>';
							data.addres.title = 'Нажмите чтобы центровать на миникарте.';
							data.addres.style.cursor = 'pointer';
							$(data.addres).bind('click', function(event){
								data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно
								//log('click');
							});
							//data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно

					      } else {
						        //alert("Geocoder failed due to: " + status);
					      }
					});
				}



			});

		});
	} else if(geocoder) geocoder.geocode({'latLng': data.position}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
		var address = geocode_to_addr(results);

	  	//console.log(results);

		data.addres.innerHTML = 'Адрес: <b>' + address + '</b>';
		data.addres.title = 'Нажмите чтобы центровать на миникарте.';
		data.addres.style.cursor = 'pointer';
		$(data.addres).bind('click', function(event){
			data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно
			//log('click');
		});
	      } else {
	        //alert("Geocoder failed due to: " + status);
	      }
	});

}

var add_alert_icon = function(skey){
	//log('map:', window.config.map);

// Добавить проверку на то что карта создана (открыта страница карты)
	var ttle = 'Тревога ' + dt_to_datetime(window.config.alarm[skey].dt);
	if(window.config.alarm[skey].confirmed){
		ttle += '\r\nТревога подтверждена оператором ' + window.config.alarm[skey].confirmby;
	}

	if($('div#alert_container>span[skey="'+skey+'"]').length > 0){
		$('div#alert_container>span[skey="'+skey+'"]').remove();
		//return;
	}
	$('div#alert_container').append('<span skey="'+skey+'" title="'+ttle+'">!</span>');

	$('div#alert_container>span[skey="'+skey+'"]').click(function(){
		//log('click minimized alert. TBD show alert window.');
		show_alarm_window(skey, false);
	}).mouseenter(function(ev){
		//log('enter to ', skey, ev);
//		$(map).append('<div id="alarm_popup" style="position: absolute; left: '+ev.clientX+'px; top: '+(ev.clientY-140)+'px; width: 100px; height: 100px; border: 2px solid black; z-index:1002;">Бла бла бла: </div>');
		var msg = 'Система:<b>'+window.config.sysbykey[skey].desc+'</b><br/>' +
			'Время:<b>'+dt_to_datetime(window.config.alarm[skey].dt)+'</b><br/>';

		if(window.config.alarm[skey].confirmed){
			msg+='Тревога подтверждена оператором:<b>'+window.config.alarm[skey].confirmby+'</b><br />'+dt_to_datetime(window.config.alarm[skey].confirmwhen)+'<br/>';
		}

		$(map).append('<div id="alarm_popup">' + msg + '</div>');
	}).mouseleave(function(){
		//log('leave to ', skey);
		$('#alarm_popup').remove();
	}).mousemove(function(ev){
		//log('move to ', skey);
//		$('#alarm_popup').css({left: ev.clientX + 'px', top: (ev.clientY-140) + 'px'});
		$('#alarm_popup').css('left', (ev.clientX-$('#alarm_popup').width()/2) + 'px');
	});
}

var show_alert_icons = function(){
// TBD добавить фильтр по аккаунту.
	$.getJSON('/api/alarm/get?akey=' + window.config.akey, function (data) {
		if (data.answer && data.answer === 'ok'){
			log('alarms:', data);
			for(var i in data.alarms){
				var d = data.alarms[i];

				window.config.alarm[d.skey] = window.config.alarm[d.skey] || {};
				$.extend(window.config.alarm[d.skey], d);
				/*
				window.config.alarm[d.skey].lat = d.lpos[0];
				window.config.alarm[d.skey].lon = d.lpos[1];
				window.config.alarm[d.skey].fid = d.fid;
				window.config.alarm[d.skey].dt = d.dt;
				window.config.alarm[d.skey].dthistory = [];
				for(var j in d.dthistory)
					window.config.alarm[d.skey].dthistory.push(d.dthistory[j]);
				window.config.alarm[d.skey].confirmed = d.confirmed;
				window.config.alarm[d.skey].confirmby = d.confirmby;*/
				add_alert_icon(d.skey);
			}
		}
	});
}

window.config.alarm.show_alert_icons = show_alert_icons;

/*
$(document).ready(function() {
	show_alert_icons();
});
*/

config.updater.add('addlog', function(msg) {

	log('BASE: Alert message', msg);
	//UpdateAccountSystemList();
	if(msg.data['mtype'] != 'alarm') return;

	window.config.alarm[msg.data.skey] = window.config.alarm[msg.data.skey] || {};
	$.extend(window.config.alarm[msg.data.skey], msg.data.data);

	window.config.alarm[msg.data.skey].lpos = [msg.data.data.lat, msg.data.data.lon];
/*
	window.config.alarm[msg.data.skey] = window.config.alarm[msg.data.skey] || {};
	window.config.alarm[msg.data.skey].lat = msg.data.data.lat;
	window.config.alarm[msg.data.skey].lon = msg.data.data.lon;
	window.config.alarm[msg.data.skey].fid = msg.data.data.fid;
	window.config.alarm[msg.data.skey].dt = msg.data.data.dt;

	window.config.alarm[msg.data.skey].dthistory = window.config.alarm[msg.data.skey].dthistory || [];
	window.config.alarm[msg.data.skey].dthistory.push(msg.data.data.dt);
*/

/*
	window.config.alarm[msg.data.skey] = {
		'lat': msg.data.data.lat,
		'lon': msg.data.data.lon,
		'fid': msg.data.data.fid,
		'dt': msg.data.data.dt
	};
*/
	add_alert_icon(msg.data.skey);
	show_alarm_window(msg.data.skey, true);

});


})(jQuery);

/* config.js */
(function(window, $){
	var document = window.document;

	var sendGet = function(url) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.send();
	}
	var sendPost = function(url, body) {
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.send(body);
	}

	var saveconfig = function(it, val){
		$('#button_config_restart').button( "option", "disabled", true );
		if(val) config.ui[it] = val;
		$.ajax({
		  url: '/api/system/config?akey=' + config.akey,
		  dataType: 'json',
		  data: config.ui,
		  type: 'POST',
		  success: function(){
			//log('Saved.');
			$('#button_config_restart').button( "option", "disabled", false );
			}
		});
	}

	var UpdateSysList = function(){
		$.getJSON('/api/info?akey='+config.akey, function (data) {
			if(data){
				$("#config_sys_list").empty();
				for(var i in data.info.account.systems){
					var s = data.info.account.systems[i];
					$("#config_sys_list").append(
						//'<li class="sli" imei="'+s.imei+'"><span class="ui-icon ui-icon-arrowthick-2-n-s mm msp"></span>' +
						'<li class="ui-widget ui-widget-content ui-widget-header" imei="'+s.imei+'"><span class="ui-icon ui-icon-arrowthick-2-n-s mm msp"></span>' +
						 '<span class="bico hl mm" title="Выбрать пиктограмму">P</span>' +
						 (config.admin?'<span class="bpurge hl mm" title="Удалить GPS данные!">D</span>':'') +
						 '<span class="bconf hl mm" title="Настроить систему">C</span>' +
						 '<span class="spanbrd" title="IMEI">' + s.imei + '</span><span class="spanbrd" title="Телефон">' + (s.phone!='None'?(s.phone):'не определен') + '</span> <desc>' + s.desc + '</desc>' +
						 '<button class="key bdesc" title="Изменить описание">...</button>' +
						 '<button class="key bzone" title="Привязать ГЕО-зону">З</button>' +
						 (config.admin?'<button class="key calarm" title ="Принудительная отмена тревоги">x!</button>':'') +
						 '<button class="key bdel" title="Отказаться от слежения за системой">X</button>' +
						'</li>'
					);
				}
				/*
				$(".sli").bind('contextmenu', function(e) {
					//alert('Config');
					//$("body").append('<div style="position: absolute; left: 0px; top: 0px; border:1px solid black; width: 100px; height: 200px;">Menu</div>');
					$("#popup-sys").dialog('open');
                  			return false;
        			});
				*/
				$("#config_sys_list .calarm").button().click(function(){
					var par = $(this).parent();
					var imei = par.attr('imei');
					log('imei', imei);
					$.getJSON('/api/alarm/cancel?akey='+window.config.akey+'&imei=' + imei, function (data) {
					});
				});

				$("#config_sys_list .bdesc").button().click(function(){
					//alert(this.attributes['imei'].value);
					//var i = this.attributes['index'].value;
					var par = $(this).parent();
					var imei = par.attr('imei');
					var desc = par.find('desc').html();
					var dialog = $('#config_dialog_sys_desc');
					//log(dialog);
					//log(imei);
					//$("#sysdesc_imei").html(sys_imeis[i])
					dialog.find('label').html(imei);
					//$("#sys_desc").val(sys_descs[i]);
					dialog.find('textarea').val(desc);
					//log('Dialog: dialog-sys-desc ' + sys_imeis[i] + ' (' + sys_descs[i] + ')');
					dialog.dialog('open');
				});

				$("#config_sys_list .bzone").button().click(function(){
					var par = $(this).parent();
					var imei = par.attr('imei');
					$('#config_zone_link_imei').html(imei);
					var desc = par.find('desc').html();
					$('#config_zone_link_desc').html(desc);
					var dialog = $('#config_zone_link');
					//log('Zone links', par, imei, desc, dialog);
					dialog.dialog('open');
				});

				$('#config_sys_list .bconf').button().click(function(){
					var par = $(this).parent();
					var imei = par.attr('imei');
					var desc = par.find('desc').html();
					log('TBD! config', i);

					if($('#config_params').length === 0){
						var div = $('body').append(
							//'<div id="config_overlay" class="ui-widget-overlay"></div>' +
							'<div id="config_params">' +
							'<div id="config_params_body">Загрузка данных с сервера...</div>' +
							//'<div id="config_params_close" style="position: absolute; top: -10px; left: 50%; margin-left: -20px;"><span class="ui-icon ui-icon-close"></span></div>' +
							'</div>'
						);
					} else {
						$('#config_params_body').html('Загрузка данных с сервера...');
					}
					$.getJSON('/api/sys/config?cmd=get&imei='+imei, function (data) {
						if(data.answer == 'ok'){
							if(data.config.length === 0){
								$("#config_params_body").empty().html('Нет параметров. Возможно система еще не сохранила параметры.<br/>Можно послать SMS на номер системы с текстом <strong>saveconfig</strong> для принудительного сохранения параметров.');
							} else {
								//log('Config_GET:', data);
								var rows = '<table class="tview"><thead><tr><th>№</th><th>Имя</th><th>Описание<span id="config_params_show_all" title="Показать все" class="cursor_pointer">...</span></th><th>Значение</th><th>Заводская установка</th><th>Очередь</th></tr></thead><tbody>';
								var index = 1;
								for(var i in data.config){
									var v = data.config[i];
									rows += '<tr name="'+v[0]+'"'+ (v[1].desc?'':' class="config_hide"') +'>';
									rows +=	'<td>'+index+'</td>';
									rows += '<td>'+v[0]+'</td>';
									if(config.admin){
										rows += '<td class="cfg_changeble">' + (v[1].desc || '-') + '</td>';
									} else {
										rows += '<td>' + (v[1].desc || '-') + '</td>';
									}
									rows += '<td class="cfg_changeble'+(v[1].wait?' wait':'')+'">' + v[1].value + '</td>';
									rows += '<td>' + v[1]['default'] + '</td><td>' + ((v[1].wait)?(v[1].wait):'') + '</td></tr>';
									index += 1;
								}
								rows += '</tbody></table>';
								$("#config_params_body").empty().append(rows);
								$('#config_params').dialog('option', 'position', 'center');
								$('#config_params_show_all').click(function(){
									//log('boo');
									$('.config_hide').removeClass('config_hide');
									$('#config_params').dialog('option', 'position', 'center');
								});

								var tb = $('#config_params_body table tbody');
								//log('table = ', tb);
								//log('table>tr>td:first = ', tb.find('tr').find('td:first'));
								tb.find('tr').find('td:first').next().next().click(function(){
									if(config.admin){
                                                                        var name = $(this).parent().attr('name');
									var pvalue = $(this).html();
									var nvalue = prompt("Введите описание для '" + name + "'", pvalue);
									if(nvalue && nvalue != pvalue){
										//log('Change description', name);
										$(this).html(nvalue);
										sendGet('/api/param/desc?name=' + name + '&value=' + nvalue);
									}
									}
								}).next().click(function(){
									var name = $(this).parent().attr('name');
									var pvalue = $(this).html();
									var nvalue = prompt("Введите значение для '" + name + "'", pvalue);
									if(nvalue && nvalue != pvalue){
										//log('Change value', name);
										$(this).next().next().html(nvalue);
										$(this).addClass('wait');
										sendGet('/api/sys/config?cmd=set&imei=' + imei + '&name=' + name + '&value=' + nvalue);
									}
								});
							}
						}
					});


					/*$('#config_params_close').button().click(function(){
						$('#config_params, #config_overlay').remove();
					});*/

					$('div#config_params_body').css('max-height', $(window).height() - 200);

					$('#config_params').dialog({
						width: '90%',
						/*height: '60%',*/
						//maxHeight: $(window).height() - 100,
						modal: true,
						autoOpen: true,
						title: desc,
						//position: ['left','top'],
						buttons: {
							'Отменить задание на изменение параметров': function() {
								sendGet('/api/sys/config?cmd=cancel&imei=' + imei);
								$(this).dialog('close');
							},
							'Закрыть': function() {
								$(this).dialog('close');
							}
						}
					});

/*
<div style="outline-width: 0px; outline-style: initial; outline-color: initial; width: 500px; position: absolute; display: block; z-index: 1002; left: 533px; top: 239px; height: 150px; " class="ui-dialog ui-widget ui-widget-content ui-corner-all  ui-draggable ui-resizable" tabindex="-1" role="dialog" aria-labelledby="ui-dialog-title-config_dialog_sys_desc"><div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"><span class="ui-dialog-title" id="ui-dialog-title-config_dialog_sys_desc">Администрирование</span><a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button"><span class="ui-icon ui-icon-closethick">close</span></a></div><div id="config_dialog_sys_desc" class="ui-dialog-content ui-widget-content" style="width: auto; min-height: 0px; height: 56px; ">
	<form>
		<span>Введите описание для системы IMEI:</span><label id="sysdesc_imei">356895035359317</label><br>
       		<div><textarea id="sys_desc" name="desc" rows="1" style="width:98%;"></textarea></div>
	</form>
	</div><div class="ui-resizable-handle ui-resizable-n"></div><div class="ui-resizable-handle ui-resizable-e"></div><div class="ui-resizable-handle ui-resizable-s"></div><div class="ui-resizable-handle ui-resizable-w"></div><div class="ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se ui-icon-grip-diagonal-se" style="z-index: 1001; "></div><div class="ui-resizable-handle ui-resizable-sw" style="z-index: 1002; "></div><div class="ui-resizable-handle ui-resizable-ne" style="z-index: 1003; "></div><div class="ui-resizable-handle ui-resizable-nw" style="z-index: 1004; "></div><div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"><div class="ui-dialog-buttonset"><button type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">Применить изменения.</span></button><button type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">Отменить</span></button></div></div></div>
*/

				});

				if(config.admin) $('#config_sys_list .bpurge').button().css('color', 'red').click(function(){
					//alert('В разработке');
					var imei = $(this).parent().attr('imei');
					//log('Удаление GPS данных для системы', this, imei);
					if($('#config_purgegps').length === 0){
						$('body').append(
							//'<div id="config_overlay" class="ui-widget-overlay"></div>' +
							'<div id="config_purgegps">' +
							'Удаление GPS данных для системы<br/><strong><label></label></strong><br/><br/>' +
							'<span style="color: red">Внимание!</span> Данные старее выбранной даты будут удалены.' +
							'<input type="text" id="config_purgegps_alternate" disabled=sidabled size="30"/>' +
							'<div id="config_purgegps"></div>' +
							//'<button></button><br/>' +
							'</div>'
						);
						var div = $('#config_purgegps');
						//div.children('label').first().html(imei+':'+$(this).parent().children('desc').html());
						$('#config_purgegps').datepicker({
							altField: "#config_purgegps_alternate",
							altFormat: "dd.mm.yy DD"
						});
						//div.children('button').button().click(function(){
						//});
					}
					$('#config_purgegps label').first().html(imei+':'+$(this).parent().children('desc').html());
					//div.children('strong').children('label').first().html(imei+':'+$(this).parent().children('desc').html());
					$('#config_purgegps').dialog({
						autoOpen: true,
						title: 'Удаление GPS данных',
						modal: true,
						minHeight: 390,
						buttons: {
							'Отмена': function() {
								//sendGet('/api/sys/config?cmd=cancel&imei=' + imei);
								$(this).dialog('close');
							},
							'Выполнить!': function() {

								var dateto = $.datepicker.formatDate('ymmdd000000', $('#config_purgegps').datepicker('getDate'));
								//log('Удаление GPS данных для системы', imei, ' до даты ', dateto);
								$.getJSON('/api/geo/del?imei='+imei+'&to='+dateto, function (data) {
									if(data.answer == 'ok'){
										alert('Удаление данных поставлено в очередь. Это может потребовать некоторого времени.');
									} else {
										alert('Ошибка:\r\n'+data.result);
									}
								});

								$(this).dialog('close');
							}
						}
					});

				});

				$('#config_sys_list .bico').button().click(function(){
					alert('В разработке');
				});


				$("#config_sys_list .bdel").button().click(function(){
					$('#config_del_imei').html($(this).parent().attr('imei'));
					$('#config_del_desc').html($(this).parent().find('desc').html());
					$('#config_dialog_delsys').dialog('open');
				});

			}
		});
	}

	$(document).ready(function() {
		//log('Загрузка закладки. Конфигурация.');

		//$("#nav_config").button("option", "disabled", true);
		// a workaround for a flaw in the demo system (http://dev.jqueryui.com/ticket/4375), ignore!
		//$("#dialog:ui-dialog").dialog("destroy");

		//$('#switcher').themeswitcher();

		/*$("button").button();*/
		//$("#config_button_sys_update").click(UpdateSysList);

		UpdateSysList();

		// Закладка "Наблюдаемые системы"

		$("#config_button_sys_add").click(function(){ $("#config_dialog_addsys").dialog('open'); });

		$("textarea").keypress(function(ev){
			if(ev.which == 13) {
				//log('TEXTAREA_13:', $(this).parents('div[role="dialog"]').find('button').first());
				$(this).parents('div[role="dialog"]').find('button').first().click();
				return false;
			}
			return true;
		});

		/*
		$('#config_addsys_imei').keypress(function(ev){
			if(ev.which == 13){
				//$("#config_dialog_addsys").dialog('close');
				_addsys();
				return false;
			}
			return true;
		});
		*/

		$("#config_dialog_addsys").dialog({
			width: 400,
			height: 200,
			modal: true,
			autoOpen: false,
			buttons: {
				'Добавить систему.': function() {
					var imei = $('#config_dialog_addsys #config_addsys_imei').val();
					$.getJSON('/api/sys/add?akey='+config.akey+'&imei=' + imei, function (data) {
						//window.location = "/config";
						//$(this).dialog('close');
						if(data.result){
							var result = data.result;
							if(result == "not found"){
								//alert("Система не найдена. возможно система ни разу не выходила на связь с сервером.");
								$("#dialog_addsys_not_found").dialog('open');
							} else if(result == "already"){
								//alert("Вы уже наблюдаете за этой системой");
								$("#dialog_addsys_already").dialog('open');
								//$(this).dialog('close');
							} else if(result == "added") {
								UpdateSysList();
								//$(this).dialog('close');
							}
						}
					});
					$(this).dialog('close');
				},
				'Отменить': function() {
					$(this).dialog('close');
				}
			}
		});
		//$("#dialog-addsys").dialog('open');



		$("#config_dialog_sys_desc").dialog({
			width: 500,
			height: 150,
			modal: true,
			autoOpen: false,
			buttons: {
				'Применить изменения.': function() {
					var dialog = $(this);
					//log(dialog);
					//log($(this));
					//$("#sysdesc_imei").html(sys_imeis[i])
					var imei = dialog.find('label').html();
					//$("#sys_desc").val(sys_descs[i]);
					var desc = dialog.find('textarea').val();

					//var imei = $("#sysdesc_imei").html(); //document.getElementById('sysdesc_imei').value;
					//var desc = document.getElementById('sys_desc').value;
					//log('Set desc for sys ' + imei + ' -> ' + desc);
					$.getJSON('/api/sys/desc?akey='+config.akey+'&imei=' + imei + '&desc=' + desc, function (data) {
						if(data.result){
							var result = data.result;
							if(result == "disabled"){
								//$("#dialog-need-admin").dialog('open');
							} else if(result == "ok") {
								//UpdateSysList();
								//$("#config_sysdsc_"+imei).html(desc);
								$("#config_sys_list").find('li[imei="'+imei+'"]>desc').html(desc);
							}
						}
					});
					$(this).dialog('close');
				},
				'Отменить': function() {
					$(this).dialog('close');
				}
			}
		});

		var add_zone_rule = function(){
			var tbody = $('#config_zone_link table tbody');
			var select_zone = 
				'<select name="config_select_zone_list" style="width:100%;" title="Выберите зону" onchange="/*UpdateGroupList();*/">'+
				'	<option value="zz0">Зона 1</option>'+
				'	<option value="zz1">Зона 2</option>'+
				'	<option value="zz2">Зона 3</option>'+
				'</select>';
			var select_event =
				'<select name="config_select_event_list" style="width:100%;" title="Группа" onchange="/*UpdateGroupList();*/">'+
				'	<option value="0" title="Cообщение будет отражено в отчетах и в событиях">"Тихое" оповещение при покидании зоны</option>'+
				'	<option value="1" title="Cообщение будет выведено на экран всем пользователям, наблюдающим за системой">"Cрочное" оповещение при покидании зоны</option>'+
				'	<option value="2">"Тихое" оповещение о вхождении в зону</option>'+
				'	<option value="3">"Срочное" оповещение о вхождении в зону</option>'+
				'	<option value="4">Начало трека при покидании зоны</option>'+
				'	<option value="5">Конец трека при вхождении в зону</option>'+
				'	<option value="6">Событие 6</option>'+
				'	<option value="7">Событие 7</option>'+
				'	<option value="8">Событие 8</option>'+
				'	<option value="9">Событие 9</option>'+
				'	<option value="10">Событие 10</option>'+
				'</select>';

			tbody.append('<tr><td>'+select_zone+'</td><td>'+select_event+'</td><td>00:00:00</td><td>23:59:59</td><td>норма</td><td><button class="key">.</button></td></tr>');
			$('#config_zone_link table tbody tr:last td:last button').button({text: false, icons: {primary: "ui-icon-close"}}).click(function(){
				//log('delete zone rule', this, $(this).parent().parent());
				$(this).parent().parent().remove();
			});
		}

		window['config_delete_zone_rule'] = function(){
		}

		$('#config_zone_link_add_rule').click(function(){
			//log('add zone rule');
			add_zone_rule();
		});

		$("#config_zone_link").dialog({
			width: 800,
			height: 650,
			modal: true,
			autoOpen: false,
			open: function(event, ui){

				//log('Zone Config dialog open');
				
				//for(var i=0; i<10; i++){
				//	add_zone_rule();
				//}
				$(this).dialog('option', 'position', 'center');
			},
			buttons: {
				/*
				'За.': function() {
					var dialog = $(this);
					//log(dialog);
					//log($(this));
					//$("#sysdesc_imei").html(sys_imeis[i])
					var imei = dialog.find('label').html();
					//$("#sys_desc").val(sys_descs[i]);
					var desc = dialog.find('textarea').val();

					//var imei = $("#sysdesc_imei").html(); //document.getElementById('sysdesc_imei').value;
					//var desc = document.getElementById('sys_desc').value;
					log('Set desc for sys ' + imei + ' -> ' + desc);
					$.getJSON('/api/sys/desc?akey='+config.akey+'&imei=' + imei + '&desc=' + desc, function (data) {
						if(data.result){
							var result = data.result;
							if(result == "disabled"){
								//$("#dialog-need-admin").dialog('open');
							} else if(result == "ok") {
								//UpdateSysList();
								//$("#config_sysdsc_"+imei).html(desc);
								$("#config_sys_list").find('li[imei="'+imei+'"]>desc').html(desc);
							}
						}
					});
					$(this).dialog('close');
				},*/
				'Закрыть': function() {
					$(this).dialog('close');
				}
			}
		});

		$("#dialog_addsys_not_found").dialog({modal: true, autoOpen: false, buttons:{Ok: function(){$(this).dialog("close");}}});
		$("#dialog_addsys_already").dialog({modal: true, autoOpen: false, buttons:{Ok: function(){$(this).dialog("close");}}});

		$("#popup-sys").dialog({modal: true, autoOpen: false});
		$("#popup-sys li").button();

		$('#config_dialog_delsys').dialog({
			modal: true,
			autoOpen: false,
			buttons:{
				'Нет': function(){
					$(this).dialog("close");
				},
				'Да, отказаться от слежения': function(){
					var imei = $('#config_del_imei').html();
					$.getJSON('/api/sys/del?akey='+config.akey+'&imei=' + imei, function (data) {
						UpdateSysList();
					});
					$(this).dialog("close");
				}
			}
		});

		$("#config_list").accordion({fillSpace: true, collapsible: true});
		$("#config_sys_list").sortable({
			//delay: 500,
			//axis: 'y',
			//containment: 'parent',
			handle: '.msp',
			revert: true,
			scrollSpeed: 5,
			stop: function(event, ui){
				/*console.log(ui.item.index());
				console.log(ui.item.attr('imei'));
				console.log(ui);*/
				var imei = ui.item.attr('imei');
				var index = ui.item.index();
				$.getJSON('/api/sys/sort?akey='+config.akey+'&imei=' + imei + '&index=' + index, function (data) {
					//window.location = "/config";
					//$(this).dialog('close');
					if(data.result){
						log('Set new position for ' + imei + ' to ' + index);
					}
				});

			}
		});
		//$("#config_sys_list").disableSelection();


		// Выбор темы оформления

		$('#config_list select#config_set_theme option[value="'+config.ui.theme+'"]').attr('selected', 'selected');
		//log('Set theme item:', config.ui.theme, $('#config_list select#config_set_theme option[value="'+config.ui.theme+'"]'));

		$('#config_list #config_set_theme').bind('change', function(){
			var themename = $(this).attr('value');
			//log(themename);
			saveconfig('theme', themename);

			var hl = $('head #themecss');
			hl.attr('href', '/plugins/jquery-ui-themes-1.8.9/jquery-ui-themes-1.8.9/themes/'+themename+'/jquery.ui.all.css');
			//log(hl);
		});


		// Цвет трека
		config.ui.trackcolor = config.ui.trackcolor || '#dc00dc';
		$('#colorpickerHolder div').css('backgroundColor', config.ui.trackcolor);
		$('#colorpickerHolder').ColorPicker({
			color: config.ui.trackcolor,
			//color: '#ff0000',
			onShow: function (colpkr) {
				$(colpkr).fadeIn(100);
				//log('show');
				return false;
			},
			onHide: function (colpkr) {
				$(colpkr).fadeOut(100);
				//log('hide');
				saveconfig('trackcolor', null);
				return false;
			},
			onChange: function (hsb, hex, rgb) {
				config.ui.trackcolor = '#' + hex;
				$('#colorpickerHolder div').css('backgroundColor', config.ui.trackcolor);
				//log('change');
			}
		});



		// Перезапуск
		$('#button_config_restart').click(function(){
			window.location.href = window.location.href;
		});

		// Административные и отладочные функции

		if(config.admin){
			$("button.dbg_send_msg").click(function(){
				var imei = $(this).attr('imei');
				var text = $(this).attr('value');
				//sendGet('http://localhost/addlog?imei='+imei+'&text=%D0%92%D0%BD%D0%B5%D1%88%D0%BD%D0%B5%D0%B5+%D0%BF%D0%B8%D1%82%D0%B0%D0%BD%D0%B8%D0%B5:+%3Cb%3E%D0%BD%D0%BE%D1%80%D0%BC%D0%B0%3C/b%3E');
				sendGet('/addlog?imei='+imei+'&text='+text);
			});
			$("button.dbg_send_cfg").click(function(){
				var imei = $(this).attr('imei');
				var text = '';
				for(var i=0; i<100; i++){
					text += 'dbg.name.'+i+' INT '+i*10+' 10\n';
				}
				//sendGet('http://localhost/addlog?imei='+imei+'&text=%D0%92%D0%BD%D0%B5%D1%88%D0%BD%D0%B5%D0%B5+%D0%BF%D0%B8%D1%82%D0%B0%D0%BD%D0%B8%D0%B5:+%3Cb%3E%D0%BD%D0%BE%D1%80%D0%BC%D0%B0%3C/b%3E');
				sendPost('/config?cmd=save&imei='+imei, text);
			});
			
		}

		$('.cfg_iframe').click(function(){
			//log('boo', this);
			if($(this).find('div').length == 0){
				$(this).append('<div><iframe src="'+$(this).attr('value')+'" style="width:100%; height: 70%;">'+
				'Ваш браузер не поддерживает iframe. Сожалеем, но единственным выходом является использование другого браузера. Мы рекомендуем <a href="http://www.google.com/chrome?hl=ru">Google Chrome.</a>'+
				'</iframe></div>');
			} else {
				$(this).find('div').remove();
			}
			/*
			if($('#config_binbackup').length === 0){
				$('#dbg_binbackup').after(
				'<div id="config_binbackup" style="width: 100%; height: 300px; border: 1px solid black;"><iframe src="/binbackup" style="width: 100%; height: 100%; display: block;">'+
				'	Ваш браузер не поддерживает iframe. Сожалеем, но единственным выходом является использование другого браузера. Мы рекомендуем Google Chrome.'+
				'</iframe></div>'
				);
			} else {
				$('#config_binbackup').remove();
			}
			*/
		});


		// Главный аккордион
		// Нужно добавить проверку что вкладка активна иначе вызвать при активации закладки
		$(window).resize(function(){
			if(config.tab == 4) $("#config_list").accordion("resize");
		});
		setTimeout(function(){$("#config_list").accordion("resize")}, 1000);

		config.updater.tabs[4] = function(){
			//log('CONFIG: tab update');
			$("#config_list").accordion("resize");
			//$('#map').resize();
			//google.maps.event.trigger(map, 'resize');
		}


		//$(document).bind('contextmenu', function(e) {return false;});
	        //$(document).disableSelection();
	});

})(this, jQuery);
/* geos.js */
﻿/*
*/
(function(){

$(document).ready(function() {

	//$('#geomap').bind('click', function(){
	//	log('1111');
	//});
	//log($('#geos_body table tr:first th:last')[0].offsetLeft);

	var $gmap = null;
	var gmap = null;
	var gmarker;
	var $p = $('#geos_body table tr:first th:last')[0];

	//$('#geomap').css('left', $p.offsetLeft+$p.offsetWidth);
/*
	config.updater.tabs[3] = function(){
		$('#geomap').css('left', $p.offsetLeft+$p.offsetWidth);
		if(!$gmap){
			log('== create');
			//$("#geomap").resizable();
			$gmap = $('#geomap').gmap({
					//pos: new google.maps.LatLng(45, 35),
					//marker: 'center',
					//markertitme: title,
					zoom: 15
			});
			gmap = $($gmap).gmap('option', 'map');

			gmarker = new google.maps.Marker({
		        	//position: new google.maps.LatLng(data.stops[i].p[0], data.stops[i].p[1]),
			        map: gmap,
				title: 'Положение',
				icon: $.gmap.images['center'],
			        draggable: false
			});

		} else {
			log('== resize');
			google.maps.event.trigger(gmap, 'resize');
		}

		//var $p = $('#geos_body table tr:first th:last')[0];
		//$('#geomap').resize();
	}
*/

	var tbody = $('#geos_body table tbody');
	var skey;

	var fsource = {
		0: "-",
		1: "SUDDENSTOP",
		2: "STOPACC",
		3: "TIMESTOPACC",
		4: "SLOW",
		5: "TIMEMOVE",
		6: "START",
		7: "TIMESTOP",
		8: "ANGLE",
		9: "DELTALAT",
		10: "DELTALONG",
		11: "DELTA"
	};

	var td = function(value){
		var res = '';
		$.each(value, function(i, v){
			res += '<td>' + v + '</td>'
		});
		return res;
	}

	var genReport = function(){
		log('GEOS: Update report');
		skey = $('#geos_syslist').val();

		var type = $('#geos_type_last').attr('checked');

		var date;
		if(type){
			//date = $.datepicker.formatDate('ymmdd', new Date());
			date = new Date();
		} else {
			//date = $.datepicker.formatDate('ymmdd', $('#geos_datepicker').datepicker('getDate'));
			date = $('#geos_datepicker').datepicker('getDate');
			if(!date) return;
			log('date', date);
			//if(date == '') return;
		}

//		$.getJSON('/api/geo/report', {skey: skey, from: date+'000000', to: date+'235959'}, function (data) {
		$.getJSON('/api/geo/report', {skey: skey, from: Date_to_url(Date_to_daystart(date)), to: Date_to_url(Date_to_daystop(date))}, function (data) {
			if (data.answer && data.answer == 'ok') {

				var vdata = {
					vout: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					},
					vin: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					},
					speed: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					},
					sats: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					}
				};
				vdata.vout.data.addColumn('string', 'x');	// Часы
				vdata.vin.data.addColumn('string', 'x');	// Часы
				vdata.speed.data.addColumn('string', 'x');	// Часы
				vdata.sats.data.addColumn('string', 'x');	// Часы

			        vdata.vout.data.addColumn('number', 'Основное питание');
			        vdata.vin.data.addColumn('number', 'Резервное питание');
			        vdata.speed.data.addColumn('number', 'Скорость');
			        vdata.sats.data.addColumn('number', 'Спутники');

				var phm = '';
				var vcnt = 0;
				var p;

				var _slice=5, _tail='';
				/*if(data.points.length > 10000){
					_slice = 3;
					_tail = '00';
				} else */if(data.points.length > 200){
					_slice = 4;
					_tail = '0';
				} 

				var add_data = function(name, digits){
					var value = parseFloat((vdata[name].vsum/vcnt).toFixed(digits));
					vdata[name].data.addRow([dt_to_time(p[0]).slice(0,_slice)+_tail, value]);
					vdata[name].vsum = 0;
					vdata[name].vmin = Math.min(vdata[name].vmin, value);
					vdata[name].vmax = Math.max(vdata[name].vmax, value);
				}

				tbody.empty();
				//var progress = $( "#progressbar" );
				//progress.progressbar({value: 0});
				for(var i in data.points){
					//if(i%10 == 0){
					//	progress.progressbar({value: i*100/data.points.length});
					//}

					p = data.points[i];
					var row = '<tr>';
//					row += td([p[0], p[1].toFixed(5), p[2].toFixed(5), p[3], p[6].toFixed(1), p[4].toFixed(1), p[5].toFixed(2)]);
					row += td([dt_to_time(p[0]), p[1].toFixed(5), p[2].toFixed(5), p[3], p[6].toFixed(1), p[4].toFixed(1), p[5].toFixed(2), fsource[p[7]]]);
					row += '</tr>';
					//tbody.append(row);
					tbody.prepend(row);

					vdata.vout.vsum += p[4];
					vdata.vin.vsum += p[5];
					vdata.speed.vsum += p[6];
					vdata.sats.vsum += p[3];
					vcnt += 1;

					if(phm != dt_to_time(p[0]).slice(0,_slice)){
						phm = dt_to_time(p[0]).slice(0,_slice);

						add_data('vout', 2);
						add_data('vin', 3);
						add_data('speed', 2);
						add_data('sats', 2);

						vcnt = 0;
					}
					//vdata.addRow([p[0].toString(), 1.2]);
				}
				/*if(vcnt){
						add_data('vout', 2);
						add_data('vin', 3);
						add_data('speed', 2);
						add_data('sats', 2);
				}*/

				// Create and draw the visualization.
				var draw_data = function(name, title){
					//vdata[name].data.sort([{column: 0}]);
					$('#geos_vis_' + name).empty();
					if(vdata[name].data.getNumberOfRows()>0){
						//var delta = (vdata[name].vmax - vdata[name].vmin) / 1.0;
						var chart = new google.visualization.LineChart(document.getElementById('geos_vis_' + name));
						chart.draw(vdata[name].data, {
							curveType: "function",
							title: title,
							width: 700, height: 400,
							vAxis: {minValue: vdata[name].vmin /*- delta*/, maxValue: vdata[name].vmax /*+ delta*/},
							chartArea:{left:40,top:20,width:650,height:330},
		                  			legend: 'none',
							hAxis: {slantedTextAngle: 90}
		                		});
					}
				}

				draw_data('vout', 'Основное питание');
				draw_data('vin', 'Резервное питание');
				draw_data('speed', 'Скорость (средняя)');
				draw_data('sats', 'Спутники (усредненное значение)');
			}

			var $p = $('#geos_body table tr:first th:last')[0];
			$('#geomap').css('left', $p.offsetLeft+$p.offsetWidth);
			$('#geos_body table tr').unbind('mouseover');
			$('#geos_body table tr').bind('mouseover', function(){
				//var lat = parseFloat($(this).children()[1].slice(4,-4));
				//var lon = parseFloat($(this).children()[2].slice(4,-4));
				if($(this).children()[1] && $(this).children()[2]){
					var lat = parseFloat($(this).children()[1].innerHTML); //.slice(4,-4)
					var lon = parseFloat($(this).children()[2].innerHTML); //.slice(4,-4)
					if(!isNaN(lat) && !isNaN(lon)){
						//log('geo preview', lat, lon);
						var pos = new google.maps.LatLng(lat, lon);
						gmap.panTo(pos);
						gmarker.setPosition(pos);
					}
				}
			});
		});


	}

	$('span.showchart').click(function(){
		var name = $(this).attr('value');
		log('showchart', name);
		//if(vdata[name].data.getNumberOfRows()>0){
			$('.geos_vis').hide();
			$('#geos_vis_' + name).show();
			$('#geos_previev').show('fast');
		//}
	});

	config.updater.add('geo_change', function(msg) {
		log('GEOS: geo_change: ', msg.data);
		if(skey == msg.data.skey) {
			if($('#geos_type_last').attr('checked')) genReport();
		}
	});

	config.syslist({
		id: 'geos_syslist',
		change: function(){
			genReport();
		}
	});

	genReport();

	$('#geos_viewtype').buttonset({
	}).change(function(){
		//log('geo: buttonset_change');
		genReport();
	});
	$('#geos_datepicker').datepicker();

});

})();
/* zones.js */
﻿(function( window, $, undefined ) {

var document = window.document;

if(!('zones' in window.config)) window.config['zones'] = {};
var zones = window.config['zones'];

var update_zone_list = function(){
	$('#map_zones_list').empty();
	for(var i in zones){
		var zone = zones[i];
			if(zone.type == 'poligon'){
			$('#map_zones_list').append('<li zkey="' + i + '"> Полигон, вершин: ' + zone.poligon.getPath().length + '<span title="Удалить зону." style="display: inline-block;float:right;" class="ui-icon ui-icon-close" foo="del"></li>');
		}
	}
	$('#map_zones_list li').click(function(ev){
		var zkey = $(this).attr('zkey');
		var zone = zones[zkey];
		if(zone.type == 'poligon') {
			var bounds = new google.maps.LatLngBounds();
			var path = zone.poligon.getPath();
			log('path', path);
			for(var i=0; i<path.length; i++){
				bounds.extend(path.getAt(i));
			}
			log('Show bounds', bounds);
			window.config.map.fitBounds(bounds);
		}
	}).mouseover(function(ev){
		var zkey = $(this).attr('zkey');
		var zone = zones[zkey];
		if(zone.type == 'poligon') zone.poligon.setOptions({strokeWeight: 4});
	}).mouseout(function(ev){
		var zkey = $(this).attr('zkey');
		var zone = zones[zkey];
		if(zone.type == 'poligon') zone.poligon.setOptions({strokeWeight: 1});
	});
	$('#map_zones_list li span[foo=del]').click(function(ev){
		var zkey = $(this).parent().attr('zkey');
		log('Delete Geo-zone ', zkey);
		$.getJSON('/api/zone/del', {zkey:zkey}, function (data) {
			log('ok deleted Geo-zone ', data);
			var zone = zones[zkey];
			if(zone.type == 'poligon') zone.poligon.setMap(null);
			$('#map_zones_list li[zkey=' + zkey + ']').remove();
			delete zone.poligon;
			zone = null;
			delete zones[zkey];
		});

	});
}

$.getJSON('/api/zone/get', function (data) {
	if (data.answer && data.answer == 'ok') {
		for(var i in zones){
			if(zones[i].type == 'poligon'){
				zones[i].poligon.setMap(null);
				delete zones[i];
			}
		}
		for(var i in data.zones){
			var zone = data.zones[i];
			if(zone.type == 'poligon'){
				var path = [];
				for(var j in zone.points) path.push(new google.maps.LatLng(zone.points[j][0], zone.points[j][1]));
				var poligon = new google.maps.Polygon({
					path: path,
					clickable: false,
					strokeColor: "#FF0000",
					strokeOpacity: 0.8,
					strokeWeight: 1,
					fillColor: "#FF0000",
					fillOpacity: 0.35
					//map: window.config.map
				});
				poligon['zkey'] = zone.zkey;
				zones[zone.zkey] = {'type': 'poligon', 'poligon': poligon};
			}
		}
		update_zone_list();
	}
});

function ZoneKit(){
}

var zone_showed = false;

ZoneKit.prototype.Show = function(){
	if(!zone_showed){
		zone_showed = true;
		$('#map_zone_show>span').css('background-color', 'lime');
		for(var i in zones){
			if(zones[i].type == 'poligon') zones[i].poligon.setMap(window.config.map);
		}
	} else {
		zone_showed = false;
		$('#map_zone_show>span').css('background-color', '');
		for(var i in zones){
			if(zones[i].type == 'poligon') zones[i].poligon.setMap(null);
		}
	}
	//update_zone_list();
}

var track_edit_mode = false;

ZoneKit.prototype.AddPoligon = function(){
	var poligon;
	var events = {};

	var start_add_zone = function (){
		track_edit_mode = true;
		$('#map_zone_add>span').css('background-color', 'lime');
		message('Создавайте зону указывая на карте последовательность вершин многоугольника левой клавишей мыши. Завершение создания зоны - правая клавиша мыши.');
	}
	var stop_add_zone = function(){
		track_edit_mode = false;
		$('#map_zone_add>span').css('background-color', '');
		google.maps.event.removeListener(events.click);
		google.maps.event.removeListener(events.move);
		var vertices = poligon.getPath();
		vertices.pop();

		var points = [];
		for(var i=0; i<vertices.length; i++) {
			var p = vertices.getAt(i)
			points.push([p.lat(), p.lng()]);
		}

		$.ajax({
	  		url: '/api/zone/add?akey=' + window.config.akey,
			  dataType: 'json',
			  data: {type: 'poligon', points: JSON.stringify(points)},
			  type: 'post',
			  success: function(data){
				if(data && data.answer == 'ok'){
					poligon['zkey'] = data.zkey;
					if(!('zones' in config)) config['zones'] = {};
					zones[data.zkey] = {type: 'poligon', poligon: poligon}
					update_zone_list();
				}
			}
		});
	}

	if(!track_edit_mode){
		start_add_zone();
		var init_path = [];

		poligon = new google.maps.Polygon({
			clickable: false,
			strokeColor: "#FF0000",
			strokeOpacity: 0.8,
			strokeWeight: 1,
			fillColor: "#FF0000",
			fillOpacity: 0.35,
			map: window.config.map
		});

		log('self', self);

		events.click = google.maps.event.addListener(window.config.map, 'click', function(event){
			var vertices = poligon.getPath();
			vertices.push(event.latLng);

			if(vertices.length == 1) vertices.push(event.latLng);
		});

		events.move = google.maps.event.addListener(window.config.map, 'mousemove', function(event){
			var vertices = poligon.getPath();
			if(vertices.length > 1) vertices.setAt(vertices.length-1, event.latLng);
		});

		google.maps.event.addListenerOnce(window.config.map, 'rightclick', stop_add_zone);

	} else {
		stop_add_zone();
	}
}

var zones_activate = function(){
	for(var i in zones){
		var zone = zones[i];
		if(zone.type == 'poligon'){
			zone.poligon.setOptions({clickable: true});
			var eventsclick = google.maps.event.addListener(zone.poligon, 'mouseover', function(event){
				//log('mouseover poligon');
				if('zkey' in this) $('#map_zones_list li[zkey='+this.zkey+']').addClass('highlight');
				this.setOptions({strokeWeight: 4});
			});
			var eventsleave = google.maps.event.addListener(zone.poligon, 'mouseout', function(event){
				if('zkey' in this) $('#map_zones_list li[zkey='+this.zkey+']').removeClass('highlight');
				this.setOptions({strokeWeight: 1});
			});
		}
	}
}

var zones_deactivate = function(){
	for(var i in zones){
		var zone = zones[i];
		if(zone.type == 'poligon') zone.poligon.setOptions({clickable: false, strokeWeight: 1});
	}
}

ZoneKit.prototype.Edit = function(){
	if($('#zone_panel').css('display') == 'none'){
		$('#map_zone_edit>span').css('background-color', 'lime');

		$('#zone_panel').show('fast');
		zones_activate();

	} else {
		$('#map_zone_edit>span').css('background-color', '');
		$('#zone_panel').hide('fast');
		zones_deactivate();
	}
}

window['ZoneKit'] = ZoneKit;

})(window, jQuery);
/* directions.js */
(function( window, $, undefined ) {

var document = window.document;

var directionsDisplay = null;
var directionsService = new google.maps.DirectionsService();
var map;
var oldDirections = [];
var currentDirections = null;

var initRoute = function () {
	directionsDisplay = new google.maps.DirectionsRenderer({
		'map': window.config.map,
		'preserveViewport': true,
		'draggable': true
		//'markerOptions': {icon: }
	});
	directionsDisplay.setPanel(document.getElementById("directions_panel"));

	google.maps.event.addListener(directionsDisplay, 'directions_changed', function(){
		if (currentDirections) {
			oldDirections.push(currentDirections);
			setUndoDisabled(false);
		}
		currentDirections = directionsDisplay.getDirections();
	});

	setUndoDisabled(true);
//    calcRoute();
}

var calcRoute = function (start, end) {
	//var start = '48 Pirrama Road, Pyrmont NSW';
	//var end = 'Bondi Beach, NSW';
	var request = {
        	origin:start,
        	destination:end,
		travelMode: google.maps.DirectionsTravelMode.DRIVING,
		unitSystem : google.maps.DirectionsUnitSystem.METRIC,
		region: 'de'
	};
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
		}
	});
}

var undo = function () {
	currentDirections = null;
	directionsDisplay.setDirections(oldDirections.pop());
	if (!oldDirections.length) {
		setUndoDisabled(true);
	}
}

var setUndoDisabled = function (value) {
	document.getElementById("dir_panel_undo").disabled = value;
}

function DirKit(){
	//log('DirKit init');
	$('#dir_panel_undo').click(undo);
}

var track_mode = false;

var events = {fclick: null, sclick:null};

DirKit.prototype.Route = function(){
	//log('DirKit::Route');
	var start_marker = null;

	if(!track_mode){
		track_mode = true;
		message('Укажите начальную точку трека.');
		$('#map_track_calc>span').css('background-color', 'lime');
		events.fclick = google.maps.event.addListenerOnce(window.config.map, 'click', function(event){
			var start = event.latLng;
			start_marker = new google.maps.Marker({
		        	position: start,
			        map: window.config.map,
				title: '',
				icon: $.gmap.images['start'],
			        draggable: true
			});

			message('Укажите конечную точку трека.');
			events.sclick = google.maps.event.addListenerOnce(window.config.map, 'click', function(event){
				var end = event.latLng;
				/*var finish_marker = new google.maps.Marker({
			        	position: end,
				        map: window.config.map,
					title: '',
					icon: $.gmap.images['finish'],
				        draggable: true
				});*/
				start_marker.setMap(null);
				start_marker = null;
				//delete start_marker;

				if(!directionsDisplay) initRoute();
				calcRoute(start, end);
				$('#dir_panel').show('fast');
			});
		});
		//log('events.fclick', events.fclick, events);
	} else {
		//log('DirKit cancel route.', events);
		track_mode = false;
		$('#dir_panel').hide('fast');
		/*if(events.fclick != null) */google.maps.event.removeListener(events.fclick);
		if(events.sclick != null) google.maps.event.removeListener(events.sclick);
		if(start_marker) {start_marker.setMap(null); start_marker = null;}
		$('#map_track_calc>span').css('background-color', '');
	}
}

window['DirKit'] = DirKit;

})(window, jQuery);
/* maps.js */
(function(){

var map = null;

var show_bounds = false;

var geocoder;

var ruler1 = null;
var skey = null;
//var rulers = [];

var prev_minp = -1;

var flightPlanCoordinates = [];
//var zooms = []

var showed_path = [];
//showed_path = new google.maps.MVCArray();

var flightPath = null; //[];
var flightPathBounds = null;
//var fpi = 0;

var stop_markers = [];

var PROFILE = false;

function Profile(name){
	if(!PROFILE) return;
	this.name = name;
	this.start = new Date();
	log("Profile: " + name + " start ");
}

Profile.prototype.show = function(){
	if(!PROFILE) return;
	var end = new Date();
	var time = end.getTime() - this.start.getTime();
	log("Profile: " + this.name + " - " + time + " ms");
}

var main_bound_rectangle = null;
var sub_bounds = [];
var sub_bound_rectangles = [];
var sub_bound_indexes = [];
var search_bound_rectangle = null;

/*
function LoadPoints1(){
	path = '/debug/msg?uid={{ account.user.user_id }}';
	var xhr = new XMLHttpRequest();
	xhr.open('POST', path, true);
	xhr.send();
}
*/

var GetPath = function(skey_, from, to){
	skey = skey_;
	ruler1.setSysKey(skey);
	//log("::GetPath.start");
	$.getJSON('/api/geo/get?skey=' + skey + '&from=' + from + '&to=' + to, function (data) {
		//$("#progress").html("Обрабатываем...");
		//log("getJSON parce");
		if (data.answer && data.points.length > 0) {
			ParcePath(data);
		}
	});
	//log("::GetPath.end");
}

/*
mLatLng = function(la, lo, z){
//	base.constructor.call(la, lo);
//	google.maps.LatLng.prototype.constructor(la, lo);
//	mLatLng_base(la, lo);
	this.constructor.prototype.constructor.call(this, la, lo);
	this.zoom = z;
};

mLatLng.prototype = new google.maps.LatLng.prototype.constructor();
*/

var dt_to_Date = function (d){
/*	var h = parseInt(d.slice(6, 8), 10);
	var dat = new Date(
			parseInt('20' + d[0]+d[1], 10),	// год
			parseInt(d[2]+d[3], 10) - 1,	// месяц
			parseInt(d[4]+d[5], 10),	// день
			parseInt(d[6]+d[7], 10),	// часы
			parseInt(d[8]+d[9], 10),	// минуты
			parseInt(d[10]+d[11], 10)	// секунды
	);
	console.log('d=' + d + ' h:' + h + '  new Date =', dat);
	return dat;
*/
	return new Date(Date.UTC(
			parseInt('20' + d[0]+d[1], 10),	// год
			parseInt(d[2]+d[3], 10) - 1,	// месяц
			parseInt(d[4]+d[5], 10),	// день
			parseInt(d[6]+d[7], 10),	// часы
			parseInt(d[8]+d[9], 10),	// минуты
			parseInt(d[10]+d[11], 10)	// секунды
	));

}

/*
function t_to_hms(d){
	var minutes = (d - (d % 60)) / 60;
	var hours = (minutes - (minutes % 60)) / 60;
	minutes = minutes % 60;
	var seconds = d % 60;
	if(hours) return hours + ' ч ' + minutes + ' мин ' + seconds + ' сек';
	else if(minutes) return minutes + ' мин ' + seconds + ' сек';
	else return seconds + ' сек';
}
*/

/*
var Image_Stop = new google.maps.MarkerImage(
	'/images/marker-stop.png',
	new google.maps.Size(16, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(7, 19)
);

var Image_Halt = new google.maps.MarkerImage(
	'/images/marker-halt.png',
	new google.maps.Size(16, 20),
	new google.maps.Point(0, 0),
	new google.maps.Point(7, 19)
);
*/

var stop_infowindow;

var marker_start = null;
var marker_finish = null;

var ParcePath = function(data){
	var profile = new Profile("GetPath");

	//log("Loading a path...");

	profile.show();
	//log("Create LatLng and calculate bounds...");
	flightPlanCoordinates = [];
	for(var i in data.points){
		var l = new google.maps.LatLng(data.points[i][1], data.points[i][2], false);
		l.date = data.points[i][0];
		l.angle = data.points[i][3];
		l.zoom = data.points[i][4];
		flightPlanCoordinates.push(l);
		/*
		if(i>0){
			if(data.points[i][0]<data.points[i-1][0]){
				console.log("========= ERROR in ", i);
			}
		}
		*/
	}

	flightPathBounds = new google.maps.LatLngBounds(
		new google.maps.LatLng(data.bounds.sw[0], data.bounds.sw[1]),
		new google.maps.LatLng(data.bounds.ne[0], data.bounds.ne[1])
	);
	/*	
	if(!main_bound_rectangle){
		main_bound_rectangle = new google.maps.Rectangle({
			bounds: flightPathBounds,
			map: map,
			fillColor: "#0000FF",
			fillOpacity: 0.1,
			strokeColor: "#0000FF",
			strokeOpacity: 1.0,
			strokeWeight: 4
		});
	} else {
		main_bound_rectangle.setBounds(flightPathBounds);
	}
	*/
	
	//var sw = flightPathBounds.getSouthWest();
	//var ne = flightPathBounds.getNorthEast();

	//log("Bound in request: (" + data.bounds.sw[0] + "," + data.bounds.sw[1] + ")-(" + data.bounds.ne[0] + "," + data.bounds.ne[1] + ")" );
	//map.panToBounds(flightPathBounds);
//	map.panTo(flightPlanCoordinates[flightPlanCoordinates.length-1]);

	map.fitBounds(flightPathBounds);
/*		new google.maps.LatLngBounds(
		new google.maps.LatLng(data.bounds.sw[0], data.bounds.sw[1]),
		new google.maps.LatLng(data.bounds.ne[0], data.bounds.ne[1])
	));
*/

	profile.show();
	//log("Prepare sub bounds...");
	sub_bounds = [];
	sub_bound_indexes = [];
	
	// Init sub_bounds for entire area
	for(var i in data.subbounds){
		sub_bounds.push(new google.maps.LatLngBounds(
			new google.maps.LatLng(data.subbounds[i].sw[0], data.subbounds[i].sw[1]),
			new google.maps.LatLng(data.subbounds[i].ne[0], data.subbounds[i].ne[1])
		));
		sub_bound_indexes.push(data.subbounds[i].i);
	}

	if(show_bounds){
		for(var i in sub_bounds){
			if(sub_bound_rectangles.length <= i){
				sub_bound_rectangles.push(
					new google.maps.Rectangle({
						bounds: sub_bounds[i],
						map: map,
						clickable: false,
						fillColor: "#00FF00",
						fillOpacity: 0.1,
						strokeColor: "#00FF00",
						strokeOpacity: 1.0,
						strokeWeight: 1
					})
				);
			} else {
				sub_bound_rectangles[i].setBounds(sub_bounds[i]);
			}
		}
		if(sub_bound_rectangles.length > sub_bounds.length){
			for(var i=sub_bounds.length; i<sub_bound_rectangles.length; i++){
				sub_bound_rectangles[i].setBounds(null);
			}
		}
	}

	profile.show();

	//log("Clear stop_markers...");
	for(var i in stop_markers){
		stop_markers[i].setMap(null);
	}
	stop_markers = [];
	//log("Make stop_markers...");
	for(var i in data.stops){

		var dstop = dt_to_Date(data.points[data.stops[i].i][0]);
		var dstart = dt_to_Date(data.points[data.stops[i].s][0]);

		//var dt = (dt_to_Date(data.points[data.stops[i].s][0]) - dt_to_Date(data.points[data.stops[i].i][0])) / 1000;
		var dt = (dstart - dstop) / 1000;
		var tp = '';
		var icon;


		//console.log('src:' + data.points[data.stops[i].s][0] + ' , ' + data.points[data.stops[i].i][0]);
		//console.log('dt=', dt, ' ', d1, '(', d1.getTime(), '-', d2, '(', d2.getTime());

		if(dt > 5*60) {
			tp = 'стоянка ';
			icon = $.gmap.images['stop'];
		} else {
			tp = 'остановка ';
			icon = $.gmap.images['halt'];
		}
		var marker = new google.maps.Marker({
		        	position: new google.maps.LatLng(data.stops[i].p[0], data.stops[i].p[1]),
			        map: map,
				title:
					tp + td_to_hms(dt) +
					'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
					//'\n' + dstop + '...' + dstart,
				icon: icon,
			        draggable: false
				//zIndex: -1000
			});
		google.maps.event.addListener(marker, 'click', function(moev){
			//log("Stop marker: click.");
			//console.log(this);
			//console.log(moev);

			if(1){
			//var latlng = new google.maps.LatLng(lat, lng);
			var position = this.position;
			geocoder.geocode({'latLng': this.position}, function(results, status) {
			      if (status == google.maps.GeocoderStatus.OK) {
				var address = geocode_to_addr(results);

			  	//console.log(results);

				if(stop_infowindow) stop_infowindow.close();
				stop_infowindow = new google.maps.InfoWindow({content:
					//'<div style="width: 220px; height: 220px; border: none;">'+
					address,
					//'</div>',
					position: position
				});
				stop_infowindow.open(map);

			      } else {
			        alert("Geocoder failed due to: " + status);
			      }
			    });
			}

			/*var url = 'http://maps.google.com/maps/geo?q=48.50,35.49&output=json&oe=utf8&sensor=false&key=ABQIAAAADIf1TyW8EOrlksPTOSU_ahT2yXp_ZAY8_ufC3CFXhHIE1NvwkxQA1Z3_lxzOW0j5WczdNXZJcWiYrQ';
			$.getJSON(url, function (data) {
				if (data) {
					console.log("geocoding ok.");

				}
			});*/
		});
		stop_markers.push(marker);

	}
	//log('Stop markers: ', data.stops.length);

	if(data.points.length > 0){
		//var l = new google.maps.LatLng(data.points[i][1], data.points[i][2], false);

		// Маркеры начала и конца
		if(marker_start){
			marker_start.setMap(null);
		}
		if(marker_finish){
			marker_finish.setMap(null);
		}
		marker_start = new google.maps.Marker({
			position: new google.maps.LatLng(data.points[0][1], data.points[0][2]),
			map: map,
			title: 'Начало трека: ' + dt_to_datetime(data.points[0][0]),
				//tp + td_to_hms(dt) +
				//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
				//'\n' + dstop + '...' + dstart,
			icon: $.gmap.images['begin'],
	       		draggable: false
			//zIndex: -1000
		});

		//today = new Date();
		/*today.setHours(0);
		today.setMinutes(0);
		today.setSeconds(0);
		today.setMilliseconds(0);*/

		//today = new Date().getFullYear();
		//log('selected day:', $("#datepicker").datepicker('getDate').toDateString() == new Date().toDateString());

		if($("#datepicker").datepicker('getDate').toDateString() != new Date().toDateString()){
		marker_finish = new google.maps.Marker({
			position: new google.maps.LatLng(data.points[data.points.length-1][1], data.points[data.points.length-1][2]),
				map: map,
			title: 'Конец трека: ' + dt_to_datetime(data.points[data.points.length-1][0]),
				//tp + td_to_hms(dt) +
				//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
				//'\n' + dstop + '...' + dstart,
			icon: $.gmap.images['end'],
	       		draggable: false
			//zIndex: -1000
		});
		}
	}

	profile.show();

	DrawPlyline();
	PathRebuild();
}


var once = true;

var PathRebuild = function(){
	var profile = new Profile("PathRebuild");

	var mapzoom = map.getZoom();
	//if(showed_path.length != 0){
	//	flightPath.setPath(null);
	//}

	//log("Select points for this zoom [" + mapzoom + "]");

	// Now we use STUPID optimization methon - simple skip points
	
	/*
	var projection = map.getProjection();
	var point = projection.fromLatLngToPoint(flightPlanCoordinates[0]);
	console.log("1st pont is (" + point.x + "," + point.y + ")");
	var point = projection.fromLatLngToPoint(flightPlanCoordinates[1]);
	console.log("1st pont is (" + point.x + "," + point.y + ")");
	*/

	//var step = 16-map.getZoom();
	//if(step < 1) step = 1;

	// temporraly disable draw optimization
	//step = 1;

	//console.log(" - purge old points");
	//showed_path = new google.maps.MVCArray();
	//var path = flightPath.getPath();
	//path.clear();
	showed_path = []
	//profile.show();

	//console.log(" - purge points on map");
	//if(flightPath[fpi]) flightPath[fpi].setPath(showed_path);
	//if(flightPath) flightPath.setPath(path);
	//profile.show();

	//log(" - collect new points");
	for(var i=0; i<flightPlanCoordinates.length; i++){
		//if(zooms[i] <= mapzoom)
		var p = flightPlanCoordinates[i];

		//if(flightPlanCoordinates[i].zoom <= mapzoom)
		//	showed_path.push(flightPlanCoordinates[i]);
		if(p.zoom <= mapzoom){
			showed_path.push(p);
			//showed_path.insertAt(
			//path.push(p);
		}
	}
	profile.show();

	//log(" - assign points to map");
//	if(once){
	//if(flightPath[fpi]) flightPath[fpi].setPath(showed_path);
	if(flightPath) flightPath.setPath(showed_path);
//		once = false;
//	}
	//if(flightPath) flightPath.setPath(path);
	//fpi = 1 - fpi;

	profile.show();

	//console.log

	if(config.admin){
		$("#mark1").html('Точек в треке: ' + showed_path.length + '/' + flightPlanCoordinates.length);
	} else {
		$("#mark1").html('Точек в треке: ' + flightPlanCoordinates.length);
	}
	//profile.show();
}

var UpdateMarker = function (moev){
	var start = new Date();

	if(showed_path.length == 0) return;

	var mapzoom = map.getZoom();
	var size = 0.003*Math.pow(2,13-mapzoom);
	if(size < 0.0001) size = 0.0001;
	var clat = Math.cos(moev.latLng.lat() * Math.PI / 180);
	if(clat < 0.0001) clat = 0.0001;

	var bound = new google.maps.LatLngBounds(
		new google.maps.LatLng(moev.latLng.lat() - size*clat, moev.latLng.lng() - size ),
		new google.maps.LatLng(moev.latLng.lat() + size*clat, moev.latLng.lng() + size )
	);

//	rulers[0].setPosition(new google.maps.LatLng(moev.latLng.lat()-0.5, moev.latLng.lng()-0.5));
	//rulers[0].setPosition(bound.getSouthWest());
	//rulers[1].setPosition(bound.getNorthEast());

	
	if(show_bounds){
		if(!search_bound_rectangle){
			search_bound_rectangle = new google.maps.Rectangle({
				bounds: bound,
				map: map,
				fillColor: "#00FFFF",
				fillOpacity: 0.1,
				strokeColor: "#00FFFF",
				strokeOpacity: 1.0,
				strokeWeight: 1
			});
		} else {
			search_bound_rectangle.setBounds(bound);
		}
	}

	// Highlight intersect bounds and search in bounded points
	var total_points = 0;
	var mind = 1000000000;
	var minp = 0;
	
	if(sub_bound_indexes.length != 0){
		for(var i in sub_bounds){
			if(bound.intersects(sub_bounds[i])){
				if(show_bounds){
					sub_bound_rectangles[i].setOptions({strokeWeight: 3, fillOpacity:0.3});
				}
				total_points += sub_bound_indexes[i].length;

				for(var j in sub_bound_indexes[i]){
					var p = flightPlanCoordinates[sub_bound_indexes[i][j]];
					if(bound.contains(p)){
						var d = distance(moev.latLng, p);
						if(d < mind) {
							mind = d;
							minp = sub_bound_indexes[i][j];
						}
					}
					//console.log("flightPath: d[" + i + "] = " + d);
				}

			} else {
				if(show_bounds){
					sub_bound_rectangles[i].setOptions({strokeWeight: 1, fillOpacity:0.1});
				}
			}
		}
	}

//	var projection = map.getProjection();
	//var point = projection.fromLatLngToPoint(moev.latLng);
	//$("#mark").css("left", point.x + "px");
	//$("#mark").css("top", point.y + "px");

	//console.log("flightPath: mousemove (" + moev.latLng.lat() + ";" + moev.latLng.lng() + ")");
/*
	for(var i in showed_path){
		p = showed_path[i];
		if(bound.contains(p)){
			d = distance(moev.latLng, p);
			if(d < mind) {
				mind = d;
				minp = i;
			}
		}
		//console.log("flightPath: d[" + i + "] = " + d);
	}
*/
	if(minp != prev_minp){
		ruler1.setPosition(flightPlanCoordinates[minp]);
		//ruler1.setTitle("Date: " + showed_path[minp].date);
		//$("#point_info").html("Pos: " + flightPlanCoordinates[minp]);
		//console.log("flightPath: minp set to = " + minp);
		prev_minp = minp;
		ruler1.HideInfo();
		//log('marker change', minp);
	}
	var end = new Date();
	var time = end.getTime() - start.getTime();
	//console.log("time: " + time);
	if(config.admin){
		$("#mark2").html("in s/bounds: " + total_points + " time: " + time);
	}

}

var once_map_style = true;

var CreateMap = function () {
	//log('CreateMap: begin');
	//if(google.'maps')
	geocoder = new google.maps.Geocoder();
	var $map = $('#map').gmap({
		pos: new google.maps.LatLng(35.5, 48.5),
		zoom: 10,
		//marker: 'center',
		markertitme: 'aaa'
	});

	//var map = $('#map').gmap('option', 'getMap');
	map = $($map).gmap('option', 'map');
	config.map = map;
	//$(
	//console.log('CreateMap:', map);

	google.maps.event.addListener(map, 'zoom_changed', function(){
		//console.log("Map: zoom_changed.");
		PathRebuild();
	});
	google.maps.event.addListener(map, 'mousemove', UpdateMarker);

	//google.maps.event.addListener(map, 'click', function(){
	//	console.log("Map: clicked.");
	//});

	log('create MyMarker');
	ruler1 = new MyMarker(map);
}

var lastpos = {};

var CreateLastMarker = function(p){
	//var p = data.geo[i];
	//console.log('CreateLastMarker ', p);

	if(p.data == null) return;

	var pos = new google.maps.LatLng(p.data.point.lat, p.data.point.lon);
	var tail_path = [];
	for(var j in p.data.tail){
		tail_path.push(new google.maps.LatLng(p.data.tail[j][1], p.data.tail[j][2]));
		//console.log(p.data.tail[j]);
	}

	if(lastpos[p.skey]){
		//log('Move makrer ', lastpos[p.skey].marker, ' to ', pos);
		lastpos[p.skey].position = pos;
		lastpos[p.skey].marker.setPosition(p.data.point, pos);

		if(0){
		lastpos[p.skey].tail.setPath(tail_path);
		}
		//map.panTo(pos);
	} else {
		//log('Create makrer ');

		// Последние несколько точек трека
		if(0){
		var tailPath = new google.maps.Polyline({
			//path: flightPlanCoordinates,
			path: tail_path,
			strokeColor: config.ui.trackcolor || '#dc00dc',
			strokeOpacity: 1.0,
			strokeWeight: 3
		});
		tailPath.setMap(map);
		}

		var last_pos_marker = new LastMarker({
			point: p.data.point,
			position: pos,
			map: map,
			//title: p.desc + '\n' + p.data.point.time,
			desc: p.desc,
			skey: p.skey
			//color: 'lime'
		});

		lastpos[p.skey] = {
			position: pos,
			//tail: tailPath,
			marker: last_pos_marker
		};
	}
}

var GetLastPositions = function (akey) {
	//log('Get last positions...');
	$.getJSON('/api/geo/last?akey=' + akey, function (data) {
		//$("#progress").html("Обрабатываем...");
		if (data.answer && data.answer == 'ok') {
			//log('Show last positions...');
			//console.log()
			for(var i in data.geo){
				CreateLastMarker(data.geo[i]);
			}
		}
	});

	config.updater.add('geo_change', function(msg) {
		//log('MAPS: GEO_Update: ', msg.data);
		var skey = msg.data.skey;
		//map.panTo(lastpos[skey].position);
		$.getJSON('/api/geo/last?akey=' + akey + '&skey=' + skey, function (data) {
			//log('Update last positions and tail for...', data);
			CreateLastMarker(data.geo[0]);
			/*
			var p = data.geo[0];
			var pos = new google.maps.LatLng(p.data.point.lat, p.data.point.lon);
			if(lastpos[p.skey]){
				log('Move makrer ', lastpos[p.skey].marker, ' to ', pos);
				lastpos[p.skey].position = pos;
				lastpos[p.skey].marker.setPosition(pos);
				//map.panTo(pos);
			}
			*/
		});

		//$(list).find('option[value="' + msg.data.skey + '"]').html(msg.data.desc);
	});
}

var distance = function (p1, p2) {
    var R = 6371; // km (change this constant to get miles)
    var dLat = (p2.lat()-p1.lat()) * Math.PI / 180;
    var dLon = (p2.lng()-p1.lng()) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(p1.lat() * Math.PI / 180 ) * Math.cos(p2.lat() * Math.PI / 180 ) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    //if (d>1) return Math.round(d)+"km";
    //else if (d<=1) return Math.round(d*1000)+"m";
    return d;
}


var DrawPlyline = function ()
{
	//if(flightPath.length == 2) return;
	if(flightPath) return;
	/*flightPath.push(new google.maps.Polyline({
		//path: flightPlanCoordinates,
		//path: showed_path,
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 3
	}));
	flightPath.push(new google.maps.Polyline({
		//path: flightPlanCoordinates,
		//path: showed_path,
		strokeColor: "#00FF00",
		strokeOpacity: 1.0,
		strokeWeight: 3
	}));
	flightPath[0].setMap(map);
	flightPath[1].setMap(map);*/

	flightPath = new google.maps.Polyline({
		//path: flightPlanCoordinates,
		//path: showed_path,
		strokeColor: config.ui.trackcolor || '#dc00dc',
		strokeOpacity: 1.0,
		strokeWeight: 3
	});
	flightPath.setMap(map);

	if(0){
	google.maps.event.addListener(flightPath, 'click', function(moev){
		//log("flightPath: click.");
	});

	google.maps.event.addListener(flightPath, 'mouseover', function(moev){
		//console.log("flightPath: mouseover.");
	});

	google.maps.event.addListener(flightPath, 'mouseout', function(moev){
		//console.log("flightPath: mouseout.");
	});
	}
	//google.maps.event.addListener(flightPath, 'mousemove', UpdateMarker);
	//log("Draw polyline.");
}

var ClearPath = function(skey){
	var profile = new Profile("Clear path");
	//log("Clear path.");
	showed_path = []
	//log(" - purge points on map");
	if(flightPath) flightPath.setPath(showed_path);
	//log("Clear stop_markers...");
	for(var i in stop_markers){
		stop_markers[i].setMap(null);
	}
	stop_markers = [];
	profile.show();
}

var prev_sender=null;

var SetDay = function (skey, start, stop){
	//var from = date+'000000';
	//var to = date+'235959';
	//log("::SetDay.start from:", start, " to:", stop);
	GetPath(skey, Date_to_url(start), Date_to_url(stop));
	//console.log(sender + '-' + prev_sender);
	//if(prev_sender) $('#'+prev_sender).css('background-color','');
	//if(prev_sender) $('#'+prev_sender).css({'background-color': '', '-webkit-box-shadow': ''});
	//prev_sender = sender;
	//$('#'+sender).css('background-color', 'lime');
	//$('#'+sender).css({'background-color': 'lime', 'border': '1px solid black'});
	//$('#'+sender).css({'background-color': 'lime', '-webkit-box-shadow': '0px 0px 3px #404040'});
}

var dbg_data = null;

//var monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

var DayList = function (skey, month){
	//log("::DayList.start");
	$.getJSON('/api/geo/dates?skey=' + skey + '&month='+ month, function (data) {
		//$("#progress").html("Обрабатываем...");
		//log("::DayList: getJSON parce " + data.years);
		dbg_data = data;
		if (data.answer) {
			//log('DAY_LIST: ', data);
			config.daylist = config.daylist || {};
			config.daylist.skey = skey;
			config.daylist.year = data.year;
			config.daylist.month = data.month;
			config.daylist.days = data.days;

			$("#datepicker").datepicker("refresh");

			/*
			$("#date_select table tbody a").each(function(index){
				var day = parseInt($(this).text(), 10);
				//console.log(index + ' : ' + day);

				var parent = $(this).parent();

				if(data.days.indexOf(day) == -1){
					parent.addClass('ui-datepicker-unselectable');
					parent.addClass('ui-state-disabled');
					//parent.attr('onclick', '');
					parent.removeAttr('onclick');
					parent.empty();
					parent.append('<span class="ui-state-default" href="#">'+day+'</span>');
				}
			});*/
		}
	});
	//log("::DayList.end");
}


var params = {
	changedEl: "select",
	//visRows: 5,
	scrollArrows: true
}

var UpdateDayList = function (){
	var date = $("#datepicker").datepicker('getDate');
	if(!config.cur_month) config.cur_month = $.datepicker.formatDate('yymm', date);
	//log('Update for sys ' + config.skey + ' and month ' + config.cur_month);

	DayList(config.skey, config.cur_month);
}

$(document).ready(function() {
	config.cur_month = null;
	//$(document).disableSelection();
	//$('*').not('input').disableSelection();
	//$("input").enableSelection();
	//$('div').disableSelection();
	//$('#int_select').unbind('selectstart');
	CreateMap();


	$("#date_tabs").tabs();
	$("#nav_map").button("option", "disabled", true);

	$.datepicker.setDefaults( $.datepicker.regional[ "ru" ] );
	$("#datepicker").datepicker({altField: "#alternate",
		altFormat: "yymmdd",
		minDate: '-12m +0w',
		maxDate: '+0m +0w',
		hideIfNoPrevNext: true,
		onSelect: function(dateText, inst) {
			//log('DateText:', dateText);
			var start = $(this).datepicker('getDate');
			var stop = new Date(start);
			stop.setHours(23);
			stop.setMinutes(59);
			stop.setSeconds(59);
			//log('start:', start, 'stop:', stop);
			SetDay(config.skey, start, stop);
			//UpdateDayList();
		},
		onChangeMonthYear: function(year, month, inst) {
			config.cur_month = '' + year + ((month<10)?('0'+month):month);
			UpdateDayList();
		},
		beforeShowDay: function(date){
			if(!config.daylist || config.daylist.year != date.getFullYear() || config.daylist.month != (date.getMonth()+1)){
				//UpdateDayList();
				//log(' need update');
				return [false, '', 'Загрузка информации с сервера...'];
			}

			//log(config.daylist, config.daylist.year, date.getFullYear(), config.daylist.month, date.getMonth()+1, config.daylist.days, date.getDate());

			var da = date.getDate();
			if(config.daylist.days.indexOf(da) != -1) return [true];
			else return [false, '', 'В этот день система не выходила на связь'];
			
			//return [true, 'date-css', 'Tip'];
		}
	});
		

	//var panel_state = true;
	$(".panel_control").click(function(){
		var panel = $(this).parent();
		if(panel.hasClass('stat-hided')){
			panel.removeClass('stat-hided');
			$(this).find('span').removeClass('ui-icon-circle-triangle-w').addClass('ui-icon-circle-triangle-e');
			$('#map').removeClass('stat-hided');
		} else {
			panel.addClass('stat-hided');
			$(this).find('span').removeClass('ui-icon-circle-triangle-e').addClass('ui-icon-circle-triangle-w');
			$('#map').addClass('stat-hided');
		}
	});

	GetLastPositions(config.akey);
	UpdateDayList(config.skey);
});


var UpdateGroupList = function (){
	var group = $('#group_list').attr('value');
	log('Select group:' + group);
}

var Map_SysList = function (list){
	//log('Map_SysList systems:', config.systems);
	list.empty();
	for(var i in config.systems){
		var s = config.systems[i];
		/*if(i==10){
			list.append(
				'<li class="ui-widget ui-state-error" imei="'+s.imei+'" skey="'+s.skey+'">'+
				'  <span class="ui-icon ui-icon-alert" title="Центровать последнее положение на карте"></span>'+
				s.desc+
				'</li>'
			);
		} else {*/
			list.append(
				'<li class="ui-widget ui-state-default" imei="'+s.imei+'" skey="'+s.skey+'">'+
				'  <span class="ui-icon ui-icon-zoomin" title="Центровать последнее положение на карте"></span>'+
				s.desc+
				'</li>'
			);
		/*}*/
	}

	list.find('li').click(function(){
		//log(this, $(this), this.attributes['imei'].value);
		//map_ul_sys
		$(this).parent().find('li').removeClass('ui-state-highlight');
		$(this).addClass('ui-state-highlight');
		config.skey = this.attributes['skey'].value;
		UpdateDayList();
		if(lastpos[config.skey]) map.panTo(lastpos[config.skey].position);
	}).mouseover(function(){
		var skey = $(this).attr('skey');
		$('.lastmarker').removeClass('lastup');
		$('.lastmarker[skey="' + skey + '"]').addClass('lastup');
	}).mouseout(function(){
		$('.lastmarker[skey="' + $(this).attr('skey') + '"]').removeClass('lastup');
	/*}).bind('mousewheel', function(ev){
		var skey = $(this).attr('skey');
		log('mousewheel', ev, skey);
		map.panTo(lastpos[skey].position);
		if(ev.wheelDelta < 0) map.setZoom(map.getZoom() - 1);
		else map.setZoom(map.getZoom() + 1);*/
	}).find('span').click(function(){
		//var skey = $(this).parent().attr('skey');
		//log('span:click', skey, lastpos[skey]);
		//map.panTo(lastpos[skey].position);
	});
}

$(document).ready(function(){
	var list = $('ul#map_ul_sys');

	Map_SysList(list);

	config.updater.add('changedesc', function(msg) {
		//log('MAP: Update descriptions');
		//updateLogList();
		$(list).find('li[skey="' + msg.data.skey + '"]').html(
			'  <span class="ui-icon ui-icon-zoomin" title="Центровать последнее положение на карте"></span>'+
			msg.data.desc
		).find('span').click(function(){
			var skey = $(this).parent().attr('skey');
			//log('span:click', skey, lastpos[skey]);
			map.panTo(lastpos[skey].position);
		});
		//console.log(l);
	});

	config.updater.add('changeslist', function(msg) {
		//log('MAP: Update system list');
		Map_SysList(list);
		//updateLogList();
		//$(list).find('li[skey="' + msg.data.skey + '"]').html(msg.data.desc);
		//console.log(l);
	});

	config.updater.tabs[0] = function(){
		//log('MAP: tab update');
		//$('#map').resize();
		google.maps.event.trigger(map, 'resize');
	}

	$('#map_btn_cleartrack').click(function(){
		//if(showed_path.length != 0){
		//log('clear path:', flightPath);
		if(flightPath) flightPath.setPath([]);
		// Маркеры начала и конца
		if(marker_start) marker_start.setMap(null);
		if(marker_finish) marker_finish.setMap(null);
		flightPlanCoordinates = [];
		showed_path = [];
	});

	var zonekit = new ZoneKit();
	$('#map_zone_show').click(zonekit.Show);
	$('#map_zone_add').click(zonekit.AddPoligon);
	$('#map_zone_edit').click(zonekit.Edit);

	var dirkit = new DirKit();
	$('#map_track_calc').click(dirkit.Route)


	window.config.alarm.show_alert_icons();

});

})();
/* reports.js */
(function(){

var geocoder;

var adrlist = [];

var getGeocode = function(adrlist, i, recur) {
	//console.log(adrlist[i]);
	//log('geoget at ' + i);
	if(adrlist[i].stop) log('stop: ' + i);

	if(geocoder) {
	geocoder.geocode({'latLng': new google.maps.LatLng(adrlist[i].pos[0], adrlist[i].pos[1]) }, function(results, status) {
		if(adrlist[i].stop) {log('stop2: ' + i); return;}
		if (status == google.maps.GeocoderStatus.OK) {
			var address = geocode_to_addr(results);
			$('#'+adrlist[i].id).html(address).attr('title', '');
			delete adrlist[i];
			//console.log(adrlist.some());
			var empty = true;
			for(var j in adrlist) {empty = false; break;}
			if(empty == true){
				$(".control").show();
			}

		} else {
			if(recur) {
				adrlist[i].cb = setTimeout(function(){getGeocode(adrlist, i, recur-1)}, 6000);
			} else {
				log('Error geocoding at ' + i + ' with ');
			}
		}
	});
	} else {
		delete adrlist[i];
	}
}

var genReport = function(skey, start, stop, title) {
	//$(".control").hide();
	for(var i in adrlist) { clearInterval(adrlist[i].cb); adrlist[i].stop = true; }

	$('#report_header').html('Отчет для системы ' + config.sysbykey[skey].desc + ' за ' + title + '');

	$( "#report tbody" ).empty();

	$.getJSON('/api/report/get?skey='+skey+'&from='+start+'&to='+stop, function (data) {
		//$("#progress").html("Обрабатываем...");
		log("getJSON parce");
		if (data.answer == 'ok') {
			//ParcePath(data);
			log("Show report...");

			$('#report_total_dist').html(ln_to_km(data.summary.length));
			$('#report_total_movetime').html(td_to_hms(data.summary.movetime));
			$('#report_total_avspeed').html(data.summary.speed.toFixed(1) + ' км/ч');
			$('#report_total_stoptime').html(td_to_hms(data.summary.stoptime));
			$('#report_total_maxspeed').html(data.summary.maxspeed.toFixed(1) + ' км/ч');

			var tbody = $( "#report tbody" );
			//console.log(tbody);
			adrlist = [];
			var cur_date = '';
			if(data.report.length == 0){
				tbody.append('<tr><td>Нет данных.</td></tr>');
			}

			for(var i in data.report){
				var ad_id = 'ad_' + i;
				var rec = data.report[i];
				var tp;

				switch(rec.type){
					case 'move': {
						if(rec.duration == 0) continue;
						tp = 'Движение</td><td>' + ln_to_km(rec.length) + ', ' + rec.speed.toFixed(1) + ' км/ч'; break
					}
					case 'stop': {
						//var rdiv = $('div');
						//console.log(rdiv);
						if(rec.duration < 5*60) tp = 'Остановка';
						else tp = 'Стоянка';
						adrlist.push({pos: rec.start.pos, id: ad_id, stop: false});

						tp += '</td><td id="' + ad_id + '" title="Дождитесь окончания обновления">' + rec.start.pos;
						break
					}
					default: {tp = 'Неизвестное событие (' + rec.type + ')'}
				}

				var events = '';

				for(var j in rec.events){
					log('Event: ', j, rec.events[j]);
					switch(j){
						case 'path_break': {
							events += '<span class="ui-icon ui-icon-alert" style="float:right;" title="Разрыв или повреждение трека. Данные отчета могут быть не точными." value="'+rec.events[j]+'"></span>';
							break
						}
					}
				}

				//log('cur date:', cur_date, 'date: ', dt_to_date(rec.start.time));
				if(cur_date != dt_to_date(rec.start.time)){
					cur_date = dt_to_date(rec.start.time);
					tbody.append( '<tr><td colspan="4" style="padding-top: 8px; padding-bottom: 8px; font-weight: bold;">' + cur_date + '</td></tr>');
				}
					
				tbody.append( "<tr>" +
					//"<td>" + dt_to_date(rec.start.time) + "</td>" + 
					'<td>' +
					'	<!--button class="ctl" style="float: left;"><span class="ui-icon ui-icon-cancel" title="Убрать из отчета информацию о движении"></span></button>' +
					'	<button class="ctl" style="float: left;"><span class="ui-icon ui-icon-locked" title="Оставить в отчете только информацию о движении"></span></button-->' +
					'	<!--button class="ctl" style="float: left;"><span class="ui-icon ui-icon-zoomin" title="Показать этот путь на карте" onclick="showMap(' + rec.start.pos + ',\'Стоянка ' + td_to_hms(rec.duration) + ' с ' + dt_to_time(rec.start.time) + ' по ' + dt_to_time(rec.stop.time) + '\', ' + rec.start.time + ');"></span></button-->' +
					'	<button class="ctl" style="float: left;"><span class="ui-icon ui-icon-zoomin" title="Показать на карте" onclick="showMap2(\'' + rec.start.time + '\',\'' + rec.stop.time + '\', \''+rec.type+'\');"></span></button>' +
					tp + events + "</td>" + 
					'<td>' + dt_to_time(rec.start.time) + ' - ' + dt_to_time(rec.stop.time) + "</td>" +
					'<td>' + /*td_to_hms(rec.duration) + */'' + td_to_time(rec.duration) + "</td>" +
				"</tr>" );
					
			}
			$(tbody).children('tr').click(function(){
				//log(this);
				$(this).css('font-weight', 'bold');
			});
			//log(adrlist);
			for(var i in adrlist){
				if(i==0){
					$(".control").hide();
				}
				//console.log(i);
				(function(i) {
					adrlist[i].cb = setTimeout(function(){getGeocode(adrlist, i, 50)}, 1000);
					//getGeocode(adrlist, i, 10);
				})(i);
			}

			$('.ctl').button(/*{ disabled: true }*/);
		}
	});

}
var purgeReport = function() {
	$('#report tbody').empty();
}

var showMap2 = function(from, to, type) {
	var map_div = $('#map_preview');
	if(map_div.length==0){
		var div = $('body')
		.append('<div id="map_overlay" class="ui-widget-overlay"></div>')
		.append('<div id="map_preview" style="">Загрузка карты, ожидайте...</div>');
		var map_div = $('#map_preview');
		$('#map_preview')
		.append('<div id="rmap"></div>')
		.append('<div id="map_close" style="position: absolute; top: -10px; left: 50%; margin-left: -20px;"><span class="ui-icon ui-icon-close"></span></div>');

		$('#map_close').button().click(function(){
			$('#rmap').gmap('destroy');
			$('#map_preview').remove();
			$('#map_overlay').remove();
		});

		$.getJSON('/api/geo/get?skey='+config.skey+'&from='+from+'&to='+to+'&options=nosubbounds', function (data) {
			//$("#progress").html("Обрабатываем...");
			//log("getJSON parce");
			if (data.answer && data.points.length > 0) {
				//ParcePath(data);
				log('ShowMap2:', data);

				var $map = $('#rmap').gmap({
					pos: new google.maps.LatLng(data.points[0][1], data.points[0][2]),
					zoom: 15,
					//markertitme: title,
					marker: 'center'
				});
				var map = $($map).gmap('option', 'map');
				//console.log('Map: ', map);

				if(type == 'move'){
					map.fitBounds(new google.maps.LatLngBounds(
						new google.maps.LatLng(data.bounds.sw[0], data.bounds.sw[1]),
						new google.maps.LatLng(data.bounds.ne[0], data.bounds.ne[1])
					));

					var path = [];
					for(var i in data.points){
						var l = new google.maps.LatLng(data.points[i][1], data.points[i][2], false);
						path.push(l);
					}

					var flightPath = new google.maps.Polyline({
						//path: flightPlanCoordinates,
						map: map,
						path: path,
						strokeColor: config.ui.trackcolor || '#dc00dc',
						strokeOpacity: 1.0,
						strokeWeight: 3
					});

					// Маркеры начала и конца
					var marker_start = new google.maps.Marker({
						position: new google.maps.LatLng(path[0].lat(), path[0].lng()),
						map: map,
						title: 'Старт: ' + dt_to_datetime(data.points[0][0]),
							//tp + td_to_hms(dt) +
							//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
							//'\n' + dstop + '...' + dstart,
						icon: $.gmap.images['begin'],
			        		draggable: false
						//zIndex: -1000
					});
					var marker_finish = new google.maps.Marker({
						position: new google.maps.LatLng(path[path.length-1].lat(), path[path.length-1].lng()),
						map: map,
						title: 'Финиш: ' + dt_to_datetime(data.points[path.length-1][0]),
							//tp + td_to_hms(dt) +
							//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
							//'\n' + dstop + '...' + dstart,
						icon: $.gmap.images['end'],
			        		draggable: false
						//zIndex: -1000
					});
					//log('Marker: ', marker_start, marker_finish, path);
				} else {
					// Маркер стоянки
					var marker_stop = new google.maps.Marker({
						position: new google.maps.LatLng(data.points[0][1], data.points[0][2]),
						map: map,
						title: 'Стoянка: ' +
							'\n' + dt_to_datetime(data.points[0][0]) + '...' + dt_to_datetime(data.points[data.points.length-1][0]),
							//tp + td_to_hms(dt) +
							//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
							//'\n' + dstop + '...' + dstart,
						icon: $.gmap.images['stop'],//Image_Stop,
			        		draggable: false
						//zIndex: -1000
					});
				}
				//flightPath.setMap(map);
			}
		});

		/*
		var mapOptions = {
			center: new google.maps.LatLng(48.5000, 34.599),
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			//mapTypeControl: false,
			disableDoubleClickZoom: true,
			draggableCursor: "default",
			zoom: 10,
		};
     
		map = new google.maps.Map(document.getElementById("map"), mapOptions);
		*/
	}
	//log(map_div);
}

window['showMap2'] = showMap2;

if(0){
	var showMap = function(lat, lon, title) {
		//$(this).css('border','2px solid green');
		//map = $("#map_div");
		//map.css({'left': me.pageX+10, 'top': me.pageY+10});
		var map_div = $('#map_preview');
		if(map_div.length==0){
			div = $('body')
			.append('<div id="map_overlay" class="ui-widget-overlay"></div>')
			.append('<div id="map_preview" style="">Ошибка отображения карты</div>');
			var map_div = $('#map_preview');
			$('#map_preview')
			.append('<div id="rmap"></div>')
			.append('<div id="map_close" style="position: absolute; top: -10px; left: 50%; margin-left: -20px;"><span class="ui-icon ui-icon-close"></span></div>');

			console.log();
			var $map = $('#rmap').gmap({
				pos: new google.maps.LatLng(lat, lon),
				zoom: 15,
				marker: 'center',
				markertitme: title
			});
			var map = $($map).gmap('option', 'map');

			$('#map_close').button().click(function(){
				$('#map_preview').gmap('destroy');
				$('#map_preview').remove();
				$('#map_overlay').remove();
			});

			/*
			var mapOptions = {
				center: new google.maps.LatLng(48.5000, 34.599),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				//mapTypeControl: false,
				disableDoubleClickZoom: true,
				draggableCursor: "default",
				zoom: 10,
			};
     
			map = new google.maps.Map(document.getElementById("map"), mapOptions);
			*/
		}
		log(map_div);
	} 
}

var Report_Make_SysList = function(list){
	list.empty();
	for(var i in config.systems){
		var s = config.systems[i];
		list.append('<option imei="'+s.imei+'" value="'+s.skey+'">'+s.desc+'</option>');
	}
}

$(document).ready(function() {

	if('google' in window) geocoder = new google.maps.Geocoder();
	$("#nav_reports").button("option", "disabled", true);

	$("#button_report_type_div").buttonset();

	$("#button_report_type_day").bind('change', function(){
		$('#report_div_type_interval').hide('slow');
		$('#report_div_type_day').show('slow');
		log('Boo');
	});
	$("#button_report_type_interval").bind('change', function(){
		$('#report_div_type_day').hide('slow');
		$('#report_div_type_interval').show('slow');
		log('Boo');
	});


	$('.control').button();

	$.datepicker.setDefaults( $.datepicker.regional[ "ru" ] );
	/*$( "#datepicker" ).datepicker($.datepicker.regional[ "ru" ], {altField: "#alternate",
		altFormat: "DD, d MM, yy"});*/

/*
	$('#indatepicker').datepicker({altField: "#alternate",
		altFormat: "DD, d MM, yy",
		onSelect: function(dateText, inst) {
			//console.log(inst);
			log(dateText);
			var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
			var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
			config.skey = $('#rep_syslist').attr('value');
			\genReport($('#rep_syslist').attr('value'), start, stop);
			//console.log(dateText);
			//console.log(inst);
		}
	});
	$('#control_day').click(function(){
		//alert('bu');
	});
*/

	$('#total tbody tr td').bind('click', function(me){
		log(me);
		//showMap();
	});

//	log('Загрузка закладки. Отчеты.');

if(0){
	var list = $('#rep_syslist');
	Report_Make_SysList(list);
	//}
	//updateLogList();
	config.updater.add('changedesc', function(msg) {
		log('LOGS: Update descriptions');
		//updateLogList();
		$(list).find('option[value="' + msg.data.skey + '"]').html(msg.data.desc);
		//console.log(l);
	});
	config.updater.add('changeslist', function(msg) {
		Report_Make_SysList(list);
	});
}
	//$('#log_syslist').bind('change', function(){
	/*
	list.bind('change', function(){
		config.skey = $(this).attr('value');
		//Report_Make_SysList(list);
	});
	*/


/*
		onSelect: function(dateText, inst) {
			//console.log(inst);
			log(dateText);
			var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
			var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
			config.skey = $('#rep_syslist').attr('value');
			genReport($('#rep_syslist').attr('value'), start, stop);
			//console.log(dateText);
			//console.log(inst);
		}
*/

	$('#report_date_by_day').datepicker({
		altField: "#report_dlg_byday_alternate",
			altFormat: "DD, d MM, yy"
	});

	$('#report_dlg_byday').dialog({
		modal: true,
		autoOpen: false,
		buttons:{
			'Отмена': function(){
				$(this).dialog("close");
			},
			'Построить отчет': function(){
				$(this).dialog("close");
				//var dt = $('#report_date_by_day').datepicker('getDate');
				//var start = $.datepicker.formatDate('ymmdd000000', dt);
				//var stop = $.datepicker.formatDate('ymmdd235959', dt);

				var start = $('#report_date_by_day').datepicker('getDate');
				var stop = new Date(start);
				stop.setHours(23);
				stop.setMinutes(59);
				stop.setSeconds(59);
				log('start:', start, 'stop:', stop);
				//SetDay(config.skey, start, stop);


				config.skey = $('#report_dlg_byday_syslist').val();

				genReport(config.skey, Date_to_url(start), Date_to_url(stop), $.datepicker.formatDate('dd/mm/yy', start));

				/*
				var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
				var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
				config.skey = $('#rep_syslist').attr('value');
				genReport($('#rep_syslist').attr('value'), start, stop);
				*/
			}
		},
		open: function(event, ui){
			log('Dialog open:', this, ui, event);
			var list = $('#report_dlg_byday_syslist');
			list.empty();
			for(var i in config.systems){
				var s = config.systems[i];
				list.append('<option imei="'+s.imei+'" value="'+s.skey+'"'+(s.skey==config.skey?' selected':'')+'>'+s.desc+'</option>');
			}
		}
	});



	var dates = $('#report_date_by_int_from, #report_date_by_int_to').datepicker({
	//var dates = $('#report_date_by_int_from, #report_date_by_int_to').datetimepicker({
		altFormat: "DD, d MM, yy",
		onSelect: function( selectedDate ) {
			var option = this.id == "report_date_by_int_from" ? "minDate" : "maxDate",
				instance = $( this ).data( "datepicker" );
				date = $.datepicker.parseDate(
					instance.settings.dateFormat ||
					$.datepicker._defaults.dateFormat,
					selectedDate, instance.settings );
			dates.not( this ).datepicker( "option", option, date );
		}
	});
	//log('Dates: ', dates);
	$('#report_date_by_int_from').datepicker('option', 'altField', '#report_dlg_byint_alternate_from');
	$('#report_date_by_int_to').datepicker('option', 'altField', '#report_dlg_byint_alternate_to');

	/*
	$('#report_dlg_byint_time_from_tp').timepicker({
		altField: '#report_dlg_byint_time_from',
		hourText: 'Часы',
		minuteText: 'Минуты',
    		amPmText: ['', ''],
		showPeriod: false,
		showLeadingZero: true,
		defaultTime: '00:00'
	});

	$('#report_dlg_byint_time_to_tp').timepicker({
		altField: '#report_dlg_byint_time_to',
		hourText: 'Часы',
		minuteText: 'Минуты',
    		amPmText: ['', ''],
		showPeriod: false,
		showLeadingZero: true,
		defaultTime: '23:59'
	});
	*/

	$('#report_dlg_byint').dialog({
		modal: true,
		autoOpen: false,
		width: 600,
		buttons:{
			'Отмена': function(){
				$(this).dialog("close");
			},
			'Построить отчет': function(){
				var start = $('#report_date_by_int_from').datepicker('getDate');
				var stop = $('#report_date_by_int_to').datepicker('getDate');

				var time_from = $('#report_dlg_byint_time_from').val();
				var time_to = $('#report_dlg_byint_time_to').val();
				log(time_from, /^\d\d:\d\d:\d\d$/.test(time_from), time_to, /^\d\d:\d\d:\d\d$/.test(time_to));
				if(!(/^\d\d:\d\d:\d\d$/.test(time_from)) || !(/^\d\d:\d\d:\d\d$/.test(time_to))){
					alert('Время должно задаваться в формате ЧЧ:MM:CC');
					return
				}
				$(this).dialog("close");

//				var start = $.datepicker.formatDate('ymmdd', dt_from) + time_from.replace(/:/g,'');
//				var stop = $.datepicker.formatDate('ymmdd', dt_to) + time_to.replace(/:/g,'');
				config.skey = $('#report_dlg_byint_syslist').val();

				start.setHours(parseInt(time_from.slice(0, 2), 10));
				start.setMinutes(parseInt(time_from.slice(3, 5), 10));
				start.setSeconds(parseInt(time_from.slice(6, 8), 10));

				stop.setHours(parseInt(time_to.slice(0, 2), 10));
				stop.setMinutes(parseInt(time_to.slice(3, 5), 10));
				stop.setSeconds(parseInt(time_to.slice(6, 8), 10));


/*				var start = $('#report_date_by_day').datepicker('getDate');
				var stop = new Date(start);
				stop.setHours(23);
				stop.setMinutes(59);
				stop.setSeconds(59);
				Date_to_url

*/

				genReport(config.skey, Date_to_url(start), Date_to_url(stop), ' интервал с ' + Date_to_datetime(start) + ' по ' + Date_to_datetime(stop));

				/*
				var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
				var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
				config.skey = $('#rep_syslist').attr('value');
				genReport($('#rep_syslist').attr('value'), start, stop);
				*/
			}
		},
		open: function(event, ui){
			log('Dialog open:', this, ui, event);
			var list = $('#report_dlg_byint_syslist');
			list.empty();
			for(var i in config.systems){
				var s = config.systems[i];
				list.append('<option imei="'+s.imei+'" value="'+s.skey+'"'+(s.skey==config.skey?' selected':'')+'>'+s.desc+'</option>');
			}
		}
	});

	$('#report_btn_do_by_day').button({
		icons: {
			primary: "ui-icon-note"
		}})
		.click(function(){$('#report_dlg_byday').dialog('open')})
		.next().button({
		icons: {
			primary: "ui-icon-note"
		}})
		.click(function(){$('#report_dlg_byint').dialog('open')});

	if(1){
	$('#report_export_xls').button().click(function(){
		var tbody = $( "#report tbody" );
		log('export to XLS tbody:', tbody);
		var rows = [];

		var format5 = function(n){
			if(n<10) return '0000'+n;
			else if(n<100) return '000'+n;
			else if(n<1000) return '00'+n;
			else if(n<10000) return '0'+n;
			else return ''+n;
		}

		$("#report tbody tr").each(function(ind, el){
			var line = [];
			$(el).children('td').each(function(tdi, tdel){
				//rows['el_' + format5(ind) + '_' + format5(tdi)] = tdel.textContent;
				line.push(tdel.textContent);
			});
			rows.push(line);
		});
		log('rows:', rows);

		//rows['all'] = JSON.stringify(rows)

		//$.getJSON('/export/xls', {data: 'aaa'}, function (data) {
		$.ajax({
			url: '/export/xls',
			type: 'post',
			data: {data: JSON.stringify(rows)},
			success: function(data, textStatus, jqXHR){
				//window.location();
				var val = $.parseJSON(data);
				log('ok, data:', data, 'val:', val);
				$('#export_iframe').attr('src', '/export/get/' + encodeURI($('#report_header').text().replace(/[\/:?\\<*>|"']/gi,'-')) + '.xls?key=' + val.key);
				log('header', $('#report_header').html());
				//$('#export_iframe').html(data);
				//var url='.';
				//var win = window.open(url,'Download');
				//win.document.write(data);

			}
			//Ext.get('iframe').set({src:result.responseText });
		});
		//'ext-gen233'
	});
	}

});

})();



/* logs.js */
// Private
(function($){
	var log_line = function(d) {
		var row = '<td>'+dt_to_datetime(d.time)+'</td><td>'+d.text+'<!--td>'+d.label+'</td-->';
		if(config.admin){
			row += '<td class="del_log" title="Удалить сообщение\nБез подтверждения!" id="dellog_'+d.key+'" key="'+d.key+'"><span class="ui-icon ui-icon-close"></span></td>'
		}
		/*$('#dellog_'+d.key).click(function(){
			log('del:' + $(this).attr('key'));
		});*/
		return row;
	}

	var UpdateDelProc = function() {
		$('td.del_log').unbind('click');
		$('td.del_log').bind('click', function(){
			//log('del:' + $(this).attr('key'));
			var row = this;
			$(row).parent().remove();
			$.getJSON('/api/logs/del?skey=' + config.skey+ '&lkey=' + $(this).attr('key'), function (data) {
				log('dellog complete');
				if (data.answer && data.answer == 'ok') {
					//$(row).parent().remove();
				}
			});
		});
	}

	var UpdateLog = function() {
		log('UpdateLog');
		var table = $("#log_table tbody");
		table.empty();

		$.getJSON('/api/logs/get?skey=' + config.skey, function (data) {
			//$("#progress").html("Обрабатываем...");
			log("getJSON parce");
			if (data.answer && data.answer == 'ok') {
				for(var i in data.logs){
					table.append('<tr>' + log_line(data.logs[i]) + '</tr>');
				}
			}
			UpdateDelProc();
		});
	}

	var Log_Make_SysList = function(list){
		list.empty();
		for(var i in config.systems){
			var s = config.systems[i];
			list.append('<option imei="'+s.imei+'" value="'+s.skey+'">'+s.desc+'</option>');
		}
	}

	$(document).ready(function() {
//		log('Загрузка закладки. События.');

		UpdateLog();

		config.syslist({
			id: 'log_syslist',
			change: function(){
				log('LOG syslist change');
				config.skey = $(this).attr('value');
				UpdateLog();
			}
		});

		/*
		var list = $('#log_syslist');

		Log_Make_SysList(list);
		config.updater.add('changedesc', function(msg) {
			//log('LOGS: Update descriptions');
			$(list).find('option[value="' + msg.data.skey + '"]').html(msg.data.desc);
		});
		config.updater.add('changeslist', function(msg) {
			Log_Make_SysList(list);
		});

		list.bind('change', function(){
			config.skey = $(this).attr('value');
			UpdateLog();
		});
		*/

		config.updater.add('addlog', function(msg) {
			if(msg.data.skey == config.skey){
				$("#log_table tbody tr:first").before('<tr>' + log_line(msg.data) + '</tr>');
				UpdateDelProc();
			}
		});
	});
	
})(jQuery);
