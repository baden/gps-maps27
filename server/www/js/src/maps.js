/*
*/

(function(window, $){
var doc = window.document;
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
var pb;

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
//	$.getJSON('/api/geo/get?skey=' + skey + '&from=' + from + '&to=' + to, function (data) {
	pb.start(100);
	//pb.updateBar(1);
	config.helper.getJSON('/api/geo/get?skey=' + skey + '&from=' + from + '&to=' + to, function (data) {
		if (data.answer && data.points.length > 0) {
			pb.updateBar(50);
			ParcePath(data);
		}
		pb.hide();
	});
}

var dt_to_Date = function (d){
	return new Date(Date.UTC(
			parseInt('20' + d[0]+d[1], 10),	// год
			parseInt(d[2]+d[3], 10) - 1,	// месяц
			parseInt(d[4]+d[5], 10),	// день
			parseInt(d[6]+d[7], 10),	// часы
			parseInt(d[8]+d[9], 10),	// минуты
			parseInt(d[10]+d[11], 10)	// секунды
	));
}

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

		if(dt > 3*60) {
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


var CreateMap = function () {
	//log('CreateMap: begin');
	//if(google.'maps')
	geocoder = new google.maps.Geocoder();

	var prev_config = localStorage.getItem('map.config');
	if(prev_config){
		prev_config = JSON.parse(prev_config);
	} else {
		prev_config = {
			zoom: 6
			, center: [48.370848,32.717285]
			, typeId: google.maps.MapTypeId.ROADMAP
		}
	}
	//prev_config.typeId = 'Quest';	// С 1м апреля
	log('Default map config', prev_config);

	var $map = $('#map').gmap({
		pos: new google.maps.LatLng(prev_config.center[0], prev_config.center[1]) // Default position - Ukraine
		, zoom: prev_config.zoom
		//marker: 'center',
		, maptype: prev_config.typeId
		, markertitme: 'aaa'
	});

	//var map = $('#map').gmap('option', 'getMap');
	map = $($map).gmap('option', 'map');
	config.map = map;
	//$(
	//console.log('CreateMap:', map);

	google.maps.event.addListener(map, 'zoom_changed', function(){
		PathRebuild();
	});
	google.maps.event.addListener(map, 'mousemove', UpdateMarker);

	var saveMapState = function() {
		localStorage.setItem('map.config', JSON.stringify({
			center: [map.getCenter().lat(), map.getCenter().lng()]
			, zoom: map.getZoom()
			, typeId: map.getMapTypeId()
		}));
		//console.log("Map: idle.", map.getZoom(), map.getCenter(), map.getMapTypeId());
	}
	
	google.maps.event.addListener(map, 'idle', saveMapState);
	google.maps.event.addListener(map, 'maptypeid_changed', saveMapState);

	//google.maps.event.addListener(map, 'click', function(){
	//	console.log("Map: clicked.");
	//});

	//log('create MyMarker');
	ruler1 = new MyMarker(map);

	var input = document.getElementById('input_map_address');
	/*var bfrom = document.createElement('button');
	bfrom.title = 'Задать как начальную точку маршрута';
	bfrom.innerText = '>...';
	var bto = document.createElement('button');
	bto.title = 'Задать как конечную точку маршрута';
	bto.innerText = '...<';
	input.parentNode.insertBefore(bfrom, input);
	input.parentNode.insertBefore(bto, input);*/

        var autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.bindTo('bounds', map);
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		var place = autocomplete.getPlace();
		if (place.geometry.viewport) {
			map.fitBounds(place.geometry.viewport);
		} else {
			map.setCenter(place.geometry.location);
			map.setZoom(17);  // Why 17? Because it looks good.
		}
		var address = '';
		if (place.address_components) {
			address = [(place.address_components[0] &&
				place.address_components[0].short_name || ''),
				(place.address_components[1] &&
				place.address_components[1].short_name || ''),
				(place.address_components[2] &&
				place.address_components[2].short_name || '')
				].join(' ');
		}

		//infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
		log('Address', place.name, address, place);

	});

	pb = progressBar();
        map.controls[google.maps.ControlPosition.RIGHT].push(pb.getDiv());
}


// TBD! От этого словаря постепенно необходимо избавится - избыточность.
var lastpos = {};

var CreateLastMarker = function(s){
	//var p = data.geo[i];
	//console.log('CreateLastMarker ', p);

	//if(p.data == null) return;
	//log('Create last point', s);
	if(!('last' in s) || (s.last === 0)) {
		log('No last in data', s);
		return;
	}

	var pos = new google.maps.LatLng(s.last.point.lat, s.last.point.lon);
	//var tail_path = [];
	//for(var j in p.data.tail){
	//	tail_path.push(new google.maps.LatLng(p.data.tail[j][1], p.data.tail[j][2]));
		//console.log(p.data.tail[j]);
	//}

	if(lastpos[s.skey]){
		//log('Move makrer ', lastpos[p.skey].marker, ' to ', pos);
		lastpos[s.skey].time = dt_to_Date(s.last.point.time).getTime();
		lastpos[s.skey].position = pos;
		lastpos[s.skey].marker.setPosition(s.last.point, pos);

		if(0){
		lastpos[s.skey].tail.setPath(tail_path);
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
			point: s.last.point,
			position: pos,
			map: map,
			//title: p.desc + '\n' + p.data.point.time,
			desc: s.desc,
			skey: s.skey
			//color: 'lime'
		});

		lastpos[s.skey] = {
			position: pos,
			time: dt_to_Date(s.last.point.time).getTime(),
			//tail: tailPath,
			marker: last_pos_marker
		};
	}
}

var dateInterval = function(){
	//window.console.group('update lasts');
	//log('update last values', lastpos);
	var now = +new Date();
	for(var i in lastpos){
		lastpos[i].marker.draw();
		var dt = (now - lastpos[i].time)/1000;
		var dtf = dt;
		if(dt<0) dt = 0;
		//log(' == dateInterval', lastpos[i], config.account.systems[i].last.point, dt);
		var dt_days = Math.floor(dt/60/60/24)
		var dt_days_lab = ((dt_days%10 == 1)&&(dt_days!=11))?' день ':((dt_days%10 in {2:0,3:0,4:0})&&!(dt_days in {12:0,13:0,14:0}))?' дня ':' дней ';

		dt = dt - dt_days*60*60*24;
		var dt_hours = Math.floor(dt/60/60)
		var dt_hours_lab = ((dt_hours%10 == 1)&&(dt_hours!=11))?' час ':((dt_hours%10 in {2:0,3:0,4:0})&&!(dt_hours in {12:0,13:0,14:0}))?' часа ':' часов ';

		dt = dt - dt_hours*60*60;
		var dt_mins = Math.floor(dt/60);
		var dt_mins_lab = ((dt_mins%10 == 1)&&(dt_mins!=11))?' минута ':((dt_mins%10 in {2:0,3:0,4:0})&&!(dt_mins in {12:0,13:0,14:0}))?' минуты ':' минут ';

		if(MapSysList){
			var el = MapSysList.element.querySelector('li[data-skey="'+i+'"]>span:first-child');
			if(el) {
				el.title = 'Поледнее известное положение\n'+dt_days+dt_days_lab + dt_hours+dt_hours_lab + dt_mins+dt_mins_lab + 'назад';
				if(dt_days > 0) {
					el.innerHTML = '' + dt_days + 'д';
				} else if(dt_hours > 0) {
					el.innerHTML = '' + dt_hours + 'ч';
				} else if(dt_mins > 0) {
					el.innerHTML = '' + dt_mins + 'м';
				} else {
					el.innerHTML = 'Ok';
				}
				if(dtf >= 10*60) {
					el.style.backgroundColor = 'rgb(192, 192, 192)';
					el.style.color = 'black';
					//el.style.color = 'white';
				} else if(config.account.systems[i].last.point.speed >= 1.0){
					el.style.backgroundColor = 'rgb(0, 192, 0)';
					el.style.color = 'black';
					//el.style.color = 'white';
				} else {
					el.style.backgroundColor = 'rgb(255, 0, 0)';
					el.style.color = 'white';
				}
			}
		}
	}
}
setInterval(dateInterval, 30000);
//setInterval(dateInterval, 5000);

var GetLastPositions = function() {
	//log('Get last positions...');
	/*
	$.getJSON('/api/geo/last', function (data) {
		//$("#progress").html("Обрабатываем...");
		if (data.answer && data.answer == 'ok') {
			//log('Show last positions...');
			//console.log()
			for(var i in data.geo){
				CreateLastMarker(data.geo[i]);
			}
			dateInterval();
		}
	});
	*/

	/*
	for(var i in config.account.systems) {
		CreateLastMarker(config.account.systems[i]);
	}
	*/
	//log('lastpos', lastpos, config.account.systems);

	/* TBD! Исключить запрос положения. Обеспечить отправку нового положения в команде оповещения geo_change */
	config.updater.add('geo_change_last', function(msg) {
		//log('MAPS: GEO_Update: ', msg);
		CreateLastMarker(msg.data);
		dateInterval();
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
		strokeWeight: 3,
		icons: [{
		    icon: {
		      path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
		      strokeColor: config.ui.trackcolor || '#dc00dc',
		      strokeWeight: 1,
		      scale: 2
		    },
		    offset: '50px',
		    repeat: '100px'
		}],
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



var UpdateGroupList = function (){
	var group = $('#group_list').attr('value');
	log('Select group:' + group);
}

var Map_SysList = function (list){
	//log('Map_SysList systems:', config.account.systems);
	list.empty();
	for(var i in config.account.systems){
		var s = config.account.systems[i];
			list.append(
				'<li class="ui-widget ui-state-default" imei="'+s.imei+'" skey="'+s.skey+'">'+
				'  <span class="ui-icon ui-icon-zoomin" title="Центровать последнее положение на карте"></span>'+
				s.desc+
				'</li>'
			);
	}

	list.find('li').click(function(){
	}).mouseover(function(){
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
		minDate: '-36m +0w',
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

	GetLastPositions();
	if(config.skey)	UpdateDayList(config.skey);


var MapSysList;

config.updater.tabs[0] = function(){
	if(!MapSysList){

		//log();

		var map_syslist;

		if(!Modernizr.touch){
			map_syslist = document.createElement('ul');
		} else {
			map_syslist = document.createElement('select');
		}
		map_syslist.id = 'map_ul_sys';
		document.getElementById('carselect').appendChild(map_syslist);

		MapSysList = new SysList('map_ul_sys', {
			element: function(s){
				var li;
				if(!Modernizr.touch){
					li = document.createElement('li');
				} else {
					li = document.createElement('option');
				}
				li.className = "ui-widget ui-state-default";
				//li.dataset.skey = s.skey;
				if(!Modernizr.touch){
				li.addEventListener('click', function(e){
					log('MapSysList:event');
					var skey = this.dataset.skey;
					[].forEach.call(this.parentNode.querySelectorAll('li'), function(el){el.classList.remove('ui-state-highlight');});
					this.classList.add('ui-state-highlight');

					config.skey = skey;
					UpdateDayList();
					if(lastpos[config.skey]) map.panTo(lastpos[config.skey].position);
				});
				li.addEventListener('mouseover', function(e){
					[].forEach.call(document.querySelectorAll('.lastmarker'), function(el){el.classList.remove('lastup');});
					var mark = document.querySelector('.lastmarker[skey="' + this.dataset.skey + '"]');
					if(mark) mark.classList.add('lastup');
				});
				li.addEventListener('mouseout', function(e){
					var mark = document.querySelector('.lastmarker[skey="' + this.dataset.skey + '"]');
					if(mark) mark.classList.remove('lastup');
				});

				//li.innerHTML = '<span class="ui-icon ui-icon-zoomin" title="Центровать последнее положение на карте"></span>' + s.desc;
				li.innerHTML = '<span style="width: 20px;font-size: 80%; font-weight: normal; text-align: right; color: #444; box-shadow: 0px 0px 1px black; margin-right: 2px; padding:1px 2px 1px 0px;overflow: hidden;/*position: absolute;right: 22px;*/background-color: white;">88ч</span>' + s.desc;

				} else {
					li.innerText = s.desc;
				}
				/*li.firstChild.addEventListener('click', function(e){
					var skey = e.target.parentNode.dataset.skey;
					//log('click on span', this, e);
					map.panTo(lastpos[skey].position);
				});*/
				//log('first child: ', li.firstChild);
				CreateLastMarker(s);
				return li;
			},
			select: function(system){
				//log('MapSysList:select', system);
				config.skey = system.key;
				UpdateDayList();
				if(lastpos[config.skey]) map.panTo(lastpos[config.skey].position);
			},
			taggroupid: 'group_list',
			tagchange: function(tag, index) {
				log('map tag change', this, tag, index);
				for(var k in config.account.systems){
					var s = config.account.systems[k];
					if((index==0) || (s.tags.indexOf(tag) != -1)){
						//document.querySelector('.lastmarker[skey="' + k + '"]').classList.remove('hidden');	// TBD! Не отпимальный вызов
						document.querySelector('.lastmarker[skey="' + k + '"]').style.display='';	// TBD! Не отпимальный вызов
						//lastpos[k].marker.setMap(map);
					} else {
						//document.querySelector('.lastmarker[skey="' + k + '"]').classList.add('hidden');
						document.querySelector('.lastmarker[skey="' + k + '"]').style.display='none';
						//lastpos[k].marker.setMap(null);
					}
				}
			}
		});
		dateInterval();
	}
	//log('MAP: tab update');
	google.maps.event.trigger(map, 'resize');
}

document.getElementById('map_btn_cleartrack').addEventListener('click', function(){
	if(flightPath) flightPath.setPath([]);
	if(marker_start) marker_start.setMap(null);
	if(marker_finish) marker_finish.setMap(null);
	flightPlanCoordinates = [];
	showed_path = [];
});

var zonekit = new ZoneKit();
$('#map_zone_show').click(zonekit.Show);
$('#map_zone_edit').click(zonekit.Edit);

var dirkit = new DirKit();
$('#map_track_calc').click(dirkit.Route)

/*
document.getElementById('map_track_calc').addEventListener('click', function(ev) {
});
*/

//window.config.alarm.show_alert_icons();
var MapPrint = function()
{
	//var w = window.open('', 'Print', 'width=300');
	//var m = config.map.getDiv();
	//var old_p = m.parentNode;

	//w.document.body.appendChild(m.cloneNode(1));
	//w.document.write(m.innerHTML);
	//w.print();
	var div = document.createElement('div');
	window.document.body.appendChild(div);
	div.style.width = '' + document.body.clientWidth + 'px';
	div.style.height = '' + document.body.scrollHeight + 'px';
	//div.style.width = '600px';
	//div.style.height = '1000px';
	//div.style.left = divpx.x - 8 + 'px';
	//div.style.top = divpx.y - 8 + 'px';

	//log('d=', div, div.style.width);
	wr_tab.style.height = window.innerHeight + 'px';
	var tab_nav = document.getElementsByClassName('ui-tabs-nav')[0];
	var map_div = document.getElementById('Tab_Map');
	var panel = $('#panel');

	tab_nav.style.display = 'none';
	map_div.style.top = '0';

	panel.addClass('stat-hided');
	//panel.find('span').removeClass('ui-icon-circle-triangle-e').addClass('ui-icon-circle-triangle-w');
	$('#map').addClass('stat-hided');

	log('== before print');
	window.print();
	log('== after print');
	panel.removeClass('stat-hided');
	//$(this).find('span').removeClass('ui-icon-circle-triangle-w').addClass('ui-icon-circle-triangle-e');
	$('#map').removeClass('stat-hided');

	tab_nav.style.display = '';
	map_div.style.top = '';

}

$('#map_print').click(MapPrint);

})(window, jQuery);
