"use strict";
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
					position: point,
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
