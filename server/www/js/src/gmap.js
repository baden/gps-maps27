/*
*/

(function( $, undefined ) {


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
		pos: new google.maps.LatLng(48.370848,32.717285), // Default position - Ukraine
		zoom: 6,
		maxZoom: 17,		// TODO: Временная борьба с тормозами на большом зуме, когда почитят - убрать
		maptype: google.maps.MapTypeId.ROADMAP,
		//maptype: 'Quest',	// С 1м апреля!
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

// ------------------------

function atanh(x) {
	return 0.5*Math.log((1+x)/(1-x));
}

var MERCATOR_RANGE = 256;
function degreesToRadians(deg) {
	return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
	return rad / (Math.PI / 180);
}
function bound(value, opt_min, opt_max) {
	if (opt_min != null) value = Math.max(value, opt_min);
	if (opt_max != null) value = Math.min(value, opt_max);
	return value;
}

function YandexProjection() {
	this.pixelOrigin_ = new google.maps.Point(128,128);
	this.pixelsPerLonDegree_ = MERCATOR_RANGE / 360;
	this.pixelsPerLonRadian_ = MERCATOR_RANGE / (2 * Math.PI);
 };

YandexProjection.prototype.fromLatLngToPoint = function(latLng) {
	var me = this;
	var point = new google.maps.Point(0, 0);
	var origin = me.pixelOrigin_;
	var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999, 0.9999);
	point.x = origin.x + latLng.lng() *me.pixelsPerLonDegree_;
	var exct = 0.0818197;
	var z = Math.sin(latLng.lat()/180*Math.PI);
	point.y = Math.abs(origin.y - me.pixelsPerLonRadian_*(atanh(z)-exct*atanh(exct*z))); 
	return point;
 };

YandexProjection.prototype.fromPointToLatLng = function(point) {
	var me = this;
	var origin = me.pixelOrigin_;
	var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
	var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
	var lat = Math.abs((2*Math.atan(Math.exp(latRadians))-Math.PI/2)*180/Math.PI);
	var Zu = lat/(180/Math.PI);
	var Zum1 = Zu+1;
	var exct = 0.0818197;
	var yy = -Math.abs(((point.y)-128));
	while (Math.abs(Zum1-Zu)>0.0000001){
		Zum1 = Zu;
		Zu = Math.asin(1-((1+Math.sin(Zum1))*Math.pow(1-exct*Math.sin(Zum1),exct))
			/(Math.exp((2*yy)/-(256/(2*Math.PI)))*Math.pow(1+exct*Math.sin(Zum1),exct)));
	}
	if (point.y>256/2) {lat=-Zu*180/Math.PI}
	else {lat=Zu*180/Math.PI}
	return new google.maps.LatLng(lat, lng);
 };

/*

Тайлы с яндекса:

http://vec01.maps.yandex.net/tiles?l=map&v=2.26.0&x=33&y=23&z=6&lang=ru-RU
http://sat02.maps.yandex.net/tiles?l=sat&v=1.33.0&x=9774&y=5675&z=14&lang=ru-RU
http://02.pvec.maps.yandex.net/?l=pmap&x=306&y=177&z=9&lang=ru-RU&v=1331236800

*/


var yandexMapType = new google.maps.ImageMapType({
	getTileUrl: function(coord, zoom) {
		//return "http://vec0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=map&v=2.16.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "";
		return "http://vec0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=map&v=2.26.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
		//return "http://sat0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=sat&v=1.33.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	alt: "Яндекс карта",
	name: "Яндекс",
	maxZoom: 17,
	minZoom:0
	//, opacity:0.9
});
yandexMapType.projection = new YandexProjection();  

var yandexSatType = new google.maps.ImageMapType({
	getTileUrl: function(coord, zoom) {
		//return "http://vec0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=map&v=2.16.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "";
		//return "http://vec0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=map&v=2.26.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
		return "http://sat0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=sat&v=1.33.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	alt: "Яндекс спутник",
	name: "Яспутник",
	maxZoom: 17,
	minZoom:0
	//, opacity:0.9
});
yandexSatType.projection = new YandexProjection();  

var yandexPipType = new google.maps.ImageMapType({
	getTileUrl: function(coord, zoom) {
		return "http://0"+((coord.x+coord.y)%5)+".pvec.maps.yandex.net/?l=pmap&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	alt: "Яндекс народная",
	name: "Янарод",
	maxZoom: 17,
	minZoom:0
	//, opacity:0.9
});
yandexPipType.projection = new YandexProjection();  

var gis2Type = new google.maps.ImageMapType({
	getTileUrl: function(coord, zoom) {
		return "http://tile"+((coord.x+coord.y)%5)+".maps.2gis.ru/tiles?x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	alt: "2Gis",
	name: "2Gis",
	maxZoom: 13,
	minZoom:0
	//, opacity:0.5
});
//gis2Type.projection = new YandexProjection();  

var WikimapiaType = new google.maps.ImageMapType({
	getTileUrl: function(coord, zoom) {
		return 'http://i'+ ((coord.x%4) + (coord.y%4) * 4) +'.wikimapia.org/?x=' + coord.x + '&y='+ coord.y +'&zoom='+ zoom +'&r=0&type=&lng=0';
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	alt: "Wikimapia",
	name: "Wikimapia",
	maxZoom: 17,		// (22) TODO: Временная борьба с тормозами на большом зуме
	minZoom:0
	//, opacity:0.5
});
//gis2Type.projection = new YandexProjection();  

var VisicomType = new google.maps.ImageMapType({
	getTileUrl: function(coord, zoom) {
		var y = Math.pow(2, zoom) - 1 - coord.y;
		return 'http://tms'+ ((coord.x+coord.y)%4) +'.visicom.ua/1.0.3/world_ru/'+ zoom +'/'+ coord.x +'/'+ y +'.png';
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	alt: "Visicom",
	name: "Visicom",
	maxZoom: 17,		// (18) TODO: Временная борьба с тормозами на большом зуме
	minZoom:0
	//, opacity:0.5
});
//VisicomType.projection = new YandexProjection();  


var QuestType = new google.maps.ImageMapType({
	getTileUrl: function(coord, zoom) {
		//return 'http://tms'+ ((coord.x+coord.y)%4) +'.visicom.ua/1.0.3/world_ru/'+ zoom +'/'+ coord.x +'/'+ coord.y +'.png';
		return 'http://mt'+ ((coord.x+coord.y)%4) +'.google.com/vt/lyrs=8bit,m@174000000&hl=en&src=app&x='+ coord.x +'&s=&y='+ coord.y +'&z='+ zoom +'&s=G';

	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	alt: "Квест",
	name: "Квест",
	maxZoom: 17,	// (22) TODO: Временная борьба с тормозами на большом зуме
	minZoom:0
	//, opacity:0.5
});


// 

// ------------------------

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

		
		if(0) { //if(!Modernizr.touch){
			var controldiv = document.createElement('div');
			controldiv.className = "map-control";
			controldiv.innerHTML = ''+
			'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_map" value="0" name="'+this._mainDivId+'_type" checked="checked" /><label for="'+this._mainDivId+'btn_map">Карта</label>'+
			'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_sat" value="1" name="'+this._mainDivId+'_type" /><label for="'+this._mainDivId+'btn_sat">Спутник</label>'+
			'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_hybr" value="2" name="'+this._mainDivId+'_type" /><label for="'+this._mainDivId+'btn_hybr">Гибрид</label>'+
			'<input type="radio" class="btn_map_type" id="'+this._mainDivId+'btn_terr" value="3" name="'+this._mainDivId+'_type" /><label for="'+this._mainDivId+'btn_terr">Рельеф</label>';
		}
		divSpan.append(mapdiv);
		if(0) { //if(!Modernizr.touch){
			divSpan.append(controldiv);
		}

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
			//mapTypeId: inst.settings.maptype || 'Quest',	// С 1м апреля!
			//mapTypeControl: ,
			//mapTypeControl: Modernizr.touch,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      			},
			scaleControl: true,
			disableDoubleClickZoom: true,
			draggableCursor: "default",
			zoom: inst.settings.zoom
		}

		var mapTypeIds = [];
		for(var type in google.maps.MapTypeId) {
			//if(google.maps.MapTypeId[type].maxZoom > 17) {
			//	google.maps.MapTypeId[type].maxZoom = 17;
			//}
            		mapTypeIds.push(google.maps.MapTypeId[type]);
		}
		mapTypeIds.push("Apple");
		mapTypeIds.push("OSM");
		mapTypeIds.push("YMAP");
		mapTypeIds.push("YSAT");
		mapTypeIds.push("YPIP");
//		mapTypeIds.push("GISMO");
		mapTypeIds.push("OVIMAP");
		mapTypeIds.push("OVISAT");
		mapTypeIds.push("2GIS");
		mapTypeIds.push("Wikimapia");
		mapTypeIds.push("Visicom");
		//mapTypeIds.push("Google");
		mapTypeIds.push("Quest");

			//, mapTypeId: "Apple"
		mapOptions = {
			center: inst.settings.pos || new google.maps.LatLng(48.5000, 34.599)
			, zoom: inst.settings.zoom
			, maxZoom: 17		// TODO: Временная борьба с тормозами на большом зуме
			, streetViewControl: false
			, mapTypeId: inst.settings.maptype || google.maps.MapTypeId.ROADMAP
			//, mapTypeId: inst.settings.maptype || 'Quest'	// С 1м апреля
			, mapTypeControlOptions: {
				mapTypeIds: mapTypeIds
				, style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			}
			, disableDoubleClickZoom: true
			, scaleControl: true
			, draggableCursor: "default"
		};
		//instsettings.map = new google.maps.Map(document.getElementById(this._mainDivId), mapOptions);
		log('mapOptions == ', mapOptions);
		var map = new google.maps.Map(mapdiv, mapOptions);
		log('map == ', map);
		/*
		map.mapTypes.roadmap.maxZoom = 17;	// TODO: Временно ограничим максимальный масштаб
		map.mapTypes.satellite.maxZoom = 17;	// TODO: Временно ограничим максимальный масштаб
		map.mapTypes.hybrid.maxZoom = 17;	// TODO: Временно ограничим максимальный масштаб
		*/
		map.mapTypes.set("Apple", new google.maps.ImageMapType({


                getTileUrl: function(coord, zoom) {
			//return "http://gsp2.apple.com/tile?api=1&style=slideshow&layers=default&lang=de_DE&z=" + zoom + "&x=" + coord.x + "&y=" + coord.y + "&v=9";
			return "http://gsp2.apple.com/tile?api=1&style=slideshow&layers=default&lang=en_EN&z=" + zoom + "&x=" + coord.x + "&y=" + coord.y + "&v=9";
                },
                tileSize: new google.maps.Size(256, 256),
                name: "Apple",
		minZoom: 3,
                maxZoom: 14
            })),

            map.mapTypes.set("OSM", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
			// ((coord.x+coord.y)%5)
                },
                tileSize: new google.maps.Size(256, 256),
                name: "OpenStreetMap",
                maxZoom: 17		// (18) TODO: Временная борьба с тормозами на большом зуме
            }));

            map.mapTypes.set("OVIMAP", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    //return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
		    return "http://c.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/normal.day/" + zoom + "/" + coord.x + "/" + coord.y + "/256/png8";
                },
                tileSize: new google.maps.Size(256, 256),
                name: "Ovi карта",
                maxZoom: 17		// (17) TODO: Временная борьба с тормозами на большом зуме
            }));

            map.mapTypes.set("OVISAT", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    //return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
		    return "http://b.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/satellite.day/" + zoom + "/" + coord.x + "/" + coord.y + "/256/png8";
                },
                tileSize: new google.maps.Size(256, 256),
                name: "Ovi спутник",
                maxZoom: 17	// (18) TODO: Временная борьба с тормозами на большом зуме
            }));

            map.mapTypes.set("Google", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    //return "http://mt.google.com/vt/hl=en&src=app&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
                    return "http://mt.google.com/vt/hl=ru&src=app&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
                },
                tileSize: new google.maps.Size(256, 256),
                name: "Google",
		maxZoom: 17		// (17) TODO: Временная борьба с тормозами на большом зуме
            }));

		map.mapTypes.set('YMAP', yandexMapType);
		map.mapTypes.set('YSAT', yandexSatType);
		map.mapTypes.set('YPIP', yandexPipType);
		map.mapTypes.set('2GIS', gis2Type);
		map.mapTypes.set('Wikimapia', WikimapiaType);
		map.mapTypes.set('Visicom', VisicomType);
		map.mapTypes.set('Quest', QuestType);
		//map.mapTypes.set('GISMO', GisMapType);

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
		if(0) {//if(!Modernizr.touch){
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
