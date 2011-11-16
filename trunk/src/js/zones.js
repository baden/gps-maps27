"use strict";
(function( window, $, undefined ) {

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
