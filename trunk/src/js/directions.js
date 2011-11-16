"use strict";
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
