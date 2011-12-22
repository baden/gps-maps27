/*
*/

(function( window, $, undefined ) {

var document = window.document;

var directionsDisplay = null;
var directionsService = new google.maps.DirectionsService();
var map;
//var oldDirections = [];
var currentDirections = null;
var dir_panel;
var track_mode = false;
var events = {fclick: null, sclick:null};
//var dir_panel = document.getElementById('dir_panel');
var points = [];


var setMarker = function(point_data, position){
	//var start = event.latLng;
	if(point_data.marker) {
		point_data.marker.setPosition(position);
		//return;
	} else {
		point_data.marker = new google.maps.Marker({
		        	position: position,
		        map: window.config.map,
			title: '',
			//icon: $.gmap.images['start'],
		        draggable: true
		});
		google.maps.event.addListener(point_data.marker, 'dragend', function(event){
			log('moved', event, this);
			geocoder.geocode({'latLng': event.latLng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					//var address = geocode_to_addr(results);
					var address = results[0].formatted_address;
					log(address, results);
					point_div.querySelector('input').value = address;
					point_data.address = address;
				}
			});
		});
	}
	geocoder.geocode({'latLng': position}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			//var address = geocode_to_addr(results);
			var address = results[0].formatted_address;
			log(address, results);
			//log(address, point_div.querySelector('input'));
			point_data.point_div.querySelector('input').value = address;
			point_data.address = address;
		}
	});

}


var initRoute = function () {
	directionsDisplay = new google.maps.DirectionsRenderer({
		'map': window.config.map,
		//'preserveViewport': true,
		'hideRouteList': true,
		'draggable': true
		//'suppressMarkers': true
		//'panel': dir_panel.querySelector('#directions_panel')
		//'markerOptions': {icon: }
	});

	google.maps.event.addListener(directionsDisplay, 'directions_changed', function(){
		/*if (currentDirections) {
			oldDirections.push(currentDirections);
			setUndoDisabled(false);
		}*/

		/* Новый подход - генерация списка по треку */

		currentDirections = directionsDisplay.getDirections();
		if(currentDirections.routes.length>1){
			log('Предлагается более одного маршрута');
		}
		var leg = currentDirections.routes[0].legs[0];

		/*
		leg.start_address;
		leg.end_address;
		leg.via_waypoint;
		*/
		log('currentDirections', currentDirections, leg);

		for(var i=0, l=leg.via_waypoint.length+2-points.length; i<l; i++){
			add_way_point('');
		}

		points[0].point_div.querySelector('input').value = leg.start_address;
		//if(points[0].marker) points[0].marker.setPosition(leg.start_location);
		setMarker(points[0], leg.start_location);

		points[points.length-1].point_div.querySelector('input').value = leg.end_address;
		//if(points[points.length-1].marker) points[points.length-1].marker.setPosition(leg.end_location);
		setMarker(points[points.length-1], leg.end_location);

		for(var i=0, l=leg.via_waypoints.length; i<l; i++){
			points[i+1].point_div.querySelector('input').value = leg.via_waypoints[i].toString(); /* Требуется определение адреса */

			//if(points[i+1].marker) points[i+1].marker.setPosition(leg.via_waypoint[i].location);
			setMarker(points[i+1], leg.via_waypoints[i]);
		}
	

		dir_panel.querySelector('span[name="distance"]').innerText = currentDirections.routes[0].legs[0].distance.text;
		dir_panel.querySelector('span[name="duration"]').innerText = currentDirections.routes[0].legs[0].duration.text;
	});

	//setUndoDisabled(true);
//    calcRoute();
}

//var point_to_value()


var calcRoute = function (start, end) {
	var request = {
        	origin: '',
        	destination: '',
		travelMode: google.maps.DirectionsTravelMode.DRIVING,
		unitSystem : google.maps.DirectionsUnitSystem.METRIC,
		region: 'de'
	};

	request.origin = (points[0].marker)?(points[0].marker.position):(points[0].address)
	request.destination = (points[points.length-1].marker)?(points[points.length-1].marker.position):(points[points.length-1].address)

	if(points.length>2){
		request.waypoints = [];
		for(var i=1; i<points.length-1; i++){
			request.waypoints.push({location:(points[i].marker)?(points[i].marker.position):(points[i].address), stopover:false});
		}
	}

	log('calcRoute', points, request);
	
	for(var i=0,l=points.length; i<l; i++){
		if(points[i].marker) points[i].marker.setMap(null);
	}

	directionsService.route(request, function(response, status) {
		log('Route done', response, status);
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
		}
	});
}

/*
var undo = function () {
	currentDirections = null;
	directionsDisplay.setDirections(oldDirections.pop());
	if (!oldDirections.length) {
		setUndoDisabled(true);
	}
}
*/

//var setUndoDisabled = function (value) {
	//document.getElementById("dir_panel_undo").disabled = value;
//}

function DirKit(){
	//log('DirKit init');
	//$('#dir_panel_undo').click(undo);
}


if('google' in window) geocoder = new google.maps.Geocoder();

var add_way_point = function(title) {
	var point_data = {};
	var point_div = config.helper.element_by_html(''+
		'<div style="position: relative;">'+
			'<div style="position:absolute;left:0px;top:0px;"><button title="Указать на карте">.</button><!--button title="Удалить">x</button><br--></div>'+
			'<div style="margin-left:30px;"><input style="width:100%;" placeholder="'+title+'"></input></div>'+
		'</div>'+
	'');
	$(point_div).find('button').button({icons: {primary: "ui-icon-search"}, text: false});
	dir_panel.firstElementChild.appendChild(point_div);
	point_data.point_div = point_div;

	point_div.querySelector('button').addEventListener('click', function(){
		//log('Set by map');
		if(point_data.marker) config.map.panTo(point_data.marker.position);
		else {
			message('Укажите точку на карте.');
			google.maps.event.addListenerOnce(window.config.map, 'click', function(event){
				setMarker(point_data, event.latLng);
			});

		}
		
	}, false);

	points.push(point_data);

	var input = point_div.querySelector('input');
	log('input', input, config.map);
        var autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.bindTo('bounds', config.map);
	
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		var place = autocomplete.getPlace();
		if(!place) return;
		if (place.geometry.viewport) {
			config.map.fitBounds(place.geometry.viewport);
		} else {
			config.map.setCenter(place.geometry.location);
			config.map.setZoom(17);  // Why 17? Because it looks good.
		}
		/*var address = '';
		if (place.address_components) {
			address = [(place.address_components[0] &&
				place.address_components[0].short_name || ''),
				(place.address_components[1] &&
				place.address_components[1].short_name || ''),
				(place.address_components[2] &&
				place.address_components[2].short_name || '')
				].join(' ');
		}*/
		//point_data.address = address;
		point_data.address = input.value;
		/*if(!point_data.marker)*/ setMarker(point_data, place.geometry.location);
		log('Адрес:', place);
	});
	/*var div = document.createElement('div');
	var input = document.createElement('input');
	input.setAttribute('placeholder', title);
	div.appendChild(input);*/
	//return element;
}

var show_dir_panel = false;

DirKit.prototype.Route = function(){
	//$(dir_panel).show('fast');
	//dir_panel.classList.toggle('hidden');
	if(!dir_panel) {
		dir_panel = config.helper.element_by_html(''+
			'<div class="map_panel">'+
				'<div name="points">'+
				'</div>'+
				'<button name="addpoint" style="display:block;margin:auto" title="Добавить пункт назначения">+</button>'+
				'<div id="directions_panel" style="width:100%;"></div>'+
				'<button name="route">Проложить маршрут</button><br>'+
				'<div style="padding-top:10px;padding-bottom:10px;border-top:1px solid #ddd;border-bottom:1px solid #ddd;">'+
					'Протяженность: <span name="distance">?</span><br>'+
					'Время в пути: <span name="duration">?</span><br>'+
				'</div>'+
				'<button name="save">Сохранить</button>'+
				'<button name="cancel">Очистить</button><br>'+
			//'	<button id="dir_panel_undo">Отменить</button><br>'+
			'</div>'+
		'');
		$(dir_panel).find('button').button();
		$($(dir_panel).find('button')[0]).button({icons: {primary: "ui-icon-plus"}, text: false});

		dir_panel.querySelector('button[name="save"]').addEventListener('click', function(){
			var label = prompt('Введите имя маршрута', '' + points[0].address + ' - ' + points[points.length-1].address);
			alert('В разработке...');
		}, false);

		dir_panel.querySelector('button[name="cancel"]').addEventListener('click', function(){
			for(var i in points){
				if(points[i].marker) {
					points[i].marker.setMap(null);
				}
			}
			points = [];
			dir_panel.firstElementChild.innerHTML = "";
			//var p = dir_panel.querySelectorAll('div[name="points"]>');
			add_way_point('Начальная точка');
			add_way_point('Конечная точка');
		}, false);

		//console.dir(dir_panel);
		//dir_panel.className='map_panel';
		add_way_point('Начальная точка');
		add_way_point('Конечная точка');
		dir_panel.querySelector('button[name="addpoint"]').addEventListener('click', function(){
			add_way_point('Введите адрес');
		}, false);
		dir_panel.querySelector('button[name="route"]').addEventListener('click', function(){
			//log('Route', points);
			calcRoute();
		}, false);

		initRoute();
	}

	if(!show_dir_panel){
		show_dir_panel = true;
		document.getElementById('panel').appendChild(dir_panel);

	} else {
		show_dir_panel = false;
		document.getElementById('panel').removeChild(dir_panel);
		//dir_panel = null;
	}

	//var add_point = function(){
	//}

	//dir_panel.appendChild(config.helper.element_by_html('<button>Проложить маршрут</button><button>Сохранить маршрут</button>'));
}

DirKit.prototype.oldRoute = function(){
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
