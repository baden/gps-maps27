"use strict";
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
		position: point,
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
					position: point,
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
/*
	if(this.arrdiv){
		var arrdiv = this.arrdiv;
		arrdiv.style.left = divpx.x - 16 + 'px';
		arrdiv.style.top = divpx.y - 16 + 'px';
	}
*/
//	console.log('MyMarker.protorype.draw.');
}
