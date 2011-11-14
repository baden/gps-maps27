"use strict";
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
