define(function () {
"use strict";
	var atanh = function(x) {
		return 0.5*Math.log((1+x)/(1-x));
	};

	var MERCATOR_RANGE = 256;

	var degreesToRadians = function (deg) {
		return deg * (Math.PI / 180);
	};

	var radiansToDegrees = function(rad) {
		return rad / (Math.PI / 180);
	};

	var bound = function(value, opt_min, opt_max) {
		if (opt_min != null) value = Math.max(value, opt_min);
		if (opt_max != null) value = Math.min(value, opt_max);
		return value;
	};

	var YandexProjection = function () {
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

	var mapTypeIds = [];
	var mapTypes = {};

	// --------------------------------
	// Карты
	mapTypeIds.push(google.maps.MapTypeId.ROADMAP);	// Стандартные типы карт

	mapTypeIds.push('OSM');
	mapTypes['OSM'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
		},
		tileSize: new google.maps.Size(256, 256),
		name: "OpenStreetMap",
		alt: "OpenStreetMap",
		maxZoom: 18
	});

	mapTypeIds.push("YMAP");
	mapTypes['YMAP'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
		return "http://vec0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=map&v=2.26.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
		},
		tileSize: new google.maps.Size(256, 256),
		isPng: true,
		alt: "Яндекс",
		name: "Яндекс",
		maxZoom: 17,
		minZoom:0
		//, opacity:0.9
	});
	mapTypes['YMAP'].projection = new YandexProjection();  

	mapTypeIds.push("YPIP");
	mapTypes['YPIP'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://0"+((coord.x+coord.y)%5)+".pvec.maps.yandex.net/?l=pmap&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
		},
		tileSize: new google.maps.Size(256, 256),
		isPng: true,
		alt: "Яндекс народная",
		name: "Яндекс народная",
		maxZoom: 17,
		minZoom:0
		//, opacity:0.9
	});
	mapTypes['YPIP'].projection = new YandexProjection();  

	mapTypeIds.push("OVIMAP");
	mapTypes['OVIMAP'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://c.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/normal.day/" + zoom + "/" + coord.x + "/" + coord.y + "/256/png8";
		},
		tileSize: new google.maps.Size(256, 256),
		name: "Ovi",
		alt: "Ovi",
		maxZoom: 18
	});

	mapTypeIds.push("2GIS");
	mapTypes['2GIS'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://tile"+((coord.x+coord.y)%5)+".maps.2gis.ru/tiles?x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
		},
		tileSize: new google.maps.Size(256, 256),
		isPng: true,
		alt: "2ГИС",
		name: "ДубльГИС",
		maxZoom: 13,
		minZoom:0
		//, opacity:0.5
	});

	mapTypeIds.push("Wikimapia");
	mapTypes['Wikimapia'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return 'http://i'+ ((coord.x%4) + (coord.y%4) * 4) +'.wikimapia.org/?x=' + coord.x + '&y='+ coord.y +'&zoom='+ zoom +'&r=0&type=&lng=0';
		},
		tileSize: new google.maps.Size(256, 256),
		isPng: true,
		alt: "Wikimapia",
		name: "Wikimapia",
		maxZoom: 22,
		minZoom:0
		//, opacity:0.5
	});

	mapTypeIds.push("Visicom");
	mapTypes['Visicom'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			var y = Math.pow(2, zoom) - 1 - coord.y;
			return 'http://tms'+ ((coord.x+coord.y)%4) +'.visicom.ua/1.0.3/world_ru/'+ zoom +'/'+ coord.x +'/'+ y +'.png';
		},
		tileSize: new google.maps.Size(256, 256),
		isPng: true,
		alt: "Visicom",
		name: "Visicom",
		maxZoom: 18,
		minZoom:0
		//, opacity:0.5
	});

	mapTypeIds.push('Apple');
	mapTypes['Apple'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://gsp2.apple.com/tile?api=1&style=slideshow&layers=default&lang=en_EN&z=" + zoom + "&x=" + coord.x + "&y=" + coord.y + "&v=9";
		},
		tileSize: new google.maps.Size(256, 256),
		name: "Apple",
		alt: "Эпл",
		minZoom: 3,
		maxZoom: 14
	});

	// --------------------------------
	// Виды со спутника
	mapTypeIds.push(google.maps.MapTypeId.SATELLITE);
	mapTypeIds.push("YSAT");
	mapTypes['YSAT'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://sat0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=sat&v=1.33.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&lang=ru-RU";
		},
		tileSize: new google.maps.Size(256, 256),
		isPng: true,
		alt: "Яндекс",
		name: "Яндекс",
		maxZoom: 17,
		minZoom:0
		//, opacity:0.9
	});
	mapTypes['YSAT'].projection = new YandexProjection();  

	mapTypeIds.push("OVISAT");
	mapTypes['OVISAT'] = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://b.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/satellite.day/" + zoom + "/" + coord.x + "/" + coord.y + "/256/png8";
		},
		tileSize: new google.maps.Size(256, 256),
		name: "Ovi",
		alt: "Ovi",
		maxZoom: 18
	});


	return {
		mapTypeIds: mapTypeIds
		, mapTypes: mapTypes
	};
});
