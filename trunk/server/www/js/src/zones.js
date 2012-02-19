/*
*/

(function( window, $, undefined ) {

var document = window.document;

//if(!('zones' in window.config)) window.config['zones'] = {};

window.config.zones = window.config.zones || {};
var zones = window.config.zones;

var once_map_style = true;
var drawingManager;
var selectedShape;
var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
var selectedColor;
var colorButtons = {};

function clearSelection() {
	if (selectedShape) {
		selectedShape.setEditable(false);
		if(selectedShape.dirty) {
			SaveZoneToServer(selectedShape);
			selectedShape.dirty = false;
		}

		selectedShape = null;
		cancelFromLocal();
	}
}

function setSelection(shape) {
	clearSelection();
	selectedShape = shape;
	shape.setEditable(true);
	selectColor(shape.get('fillColor') || shape.get('strokeColor'));
}

function deleteSelectedShape() {
	if (selectedShape) {
		//selectedShape.setMap(null);
		//log('TBD! Remove shape from server', selectedShape.zkey);
		deleteZone(selectedShape.zkey);
		cancelFromLocal();
	}
}

function selectColor(color) {
	selectedColor = color;
	for (var i = 0; i < colors.length; ++i) {
		var currColor = colors[i];
		colorButtons[currColor].style.border = currColor == color ? '2px solid #789' : '2px solid #fff';
	}

	// Retrieves the current options from the drawing manager and replaces the
	// stroke or fill color as appropriate.
	var polylineOptions = drawingManager.get('polylineOptions');
	polylineOptions.strokeColor = color;
	drawingManager.set('polylineOptions', polylineOptions);

	var rectangleOptions = drawingManager.get('rectangleOptions');
	rectangleOptions.fillColor = color;
	drawingManager.set('rectangleOptions', rectangleOptions);

	var circleOptions = drawingManager.get('circleOptions');
	circleOptions.fillColor = color;
	drawingManager.set('circleOptions', circleOptions);

	var polygonOptions = drawingManager.get('polygonOptions');
	polygonOptions.fillColor = color;
	drawingManager.set('polygonOptions', polygonOptions);
}

function setSelectedShapeColor(color) {
	if (selectedShape) {
		if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
			selectedShape.set('strokeColor', color);
		} else {
			selectedShape.set('fillColor', color);
		}
	}
}

function makeColorButton(color) {
	var button = document.createElement('span');
	button.className = 'color-button';
	button.style.backgroundColor = color;
	google.maps.event.addDomListener(button, 'click', function() {
		selectColor(color);
		setSelectedShapeColor(color);
	});

	return button;
}

function buildColorPalette() {
	var colorPalette = document.getElementById('color-palette');
	for (var i = 0; i < colors.length; ++i) {
		var currColor = colors[i];
		var colorButton = makeColorButton(currColor);
		colorPalette.appendChild(colorButton);
		colorButtons[currColor] = colorButton;
	}
	selectColor(colors[0]);
}

function deleteZone(zkey) {
	var zone = zones[zkey];
	selectedShape = null;	// Подавление паразитного сохранения
	$.getJSON('/api/zone/del', {zkey:zkey}, function (data) {
		log('ok deleted Geo-zone.', data);
	});
	zone.overlay.setMap(null);
	$('#map_zones_list li[zkey=' + zkey + ']').remove();
	delete zone.overlay;
	zone = null;
	delete zones[zkey];
	cancelFromLocal();
}

var update_zone_list = function(){
	var zone_type_names = {'polygon': 'Фигура', 'polyline': 'Линия', 'circle': 'Окружность', 'rectangle': 'Прямоугольник'};
	$('#map_zones_list').empty();
	for(var i in zones){
		var zone = zones[i];
		$('#map_zones_list').append('<li zkey="' + i + '"><span data-foo="edit" title="Информация о зоне.">E</span> '+(zone_type_names[zone.type]||'<Неподдерживаемый тип>')+'<span title="Удалить зону." class="ui-icon ui-icon-close" data-foo="del"></li>');
	}
	$('#map_zones_list li').click(function(ev){
		var zkey = $(this).attr('zkey');
		var zone = zones[zkey];
		//var bounds = getBounds(zone.overlay);
		var bounds = zone.overlay.getBounds();
		//log('Show bounds', bounds.toString());
		window.config.map.fitBounds(bounds);
		setSelection(zone.overlay);
	}).mouseover(function(ev){
		var zkey = $(this).attr('zkey');
		var zone = zones[zkey];
		zone.overlay.setOptions({strokeWeight: 4});
	}).mouseout(function(ev){
		var zkey = $(this).attr('zkey');
		var zone = zones[zkey];
		if(zone.type == 'polyline') {
			zone.overlay.setOptions({strokeWeight: 2});
		} else {
			zone.overlay.setOptions({strokeWeight: 1});
		}
	});
	$('#map_zones_list li span[data-foo=edit]').click(function(ev){
		var zkey = $(this).parent().attr('zkey');
		log('Edit Geo-zone information', zkey);

		config.helper.exdialog('/html/dialogs/zoneinfo.html', '/api/zone/info?zkey='+zkey, null, {});

		/*config.helper.getJSON('/api/zone/info?cmd=get&zkey='+zkey, function(data){
			log('/api/zone/info?get', data);
			var info = data.info;
			config.helper.dialog('/html/dialogs/zoneinfo.html', info, {
				'Применить изменения.': function() {
					var form = this.querySelector('form');
	
					data = {zkey:zkey};
					config.helper.parseform(form, data);
	
					config.helper.postJSON('/api/zone/info?cmd=set&zkey='+zkey, data, function(data){
						log('/api/zone/info?set', data);
					});
	
					$(this).dialog('close');
				}
			});
		});*/


	});
	$('#map_zones_list li span[data-foo=del]').click(function(ev){
		var zkey = $(this).parent().attr('zkey');
		log('Delete Geo-zone ', zkey);
		deleteZone(zkey);
	});
}

/* Сохраняет резутьтат редактирования на локальном компьютере на случай непредвиденного закрытия */
function saveToLocal(overlay) {
	var data;
	//var overlay = config.zones[zkey].overlay;
	switch(overlay.type){
		case 'polygon':
		case 'polyline':
			//data = overlay.getPath().getArray().map(function(el){return [el.lat(), el.lng()];});
			data = overlay.getPath().getArray().map(function(el){return el.toArray();});
			break;
		case 'circle':
			data = {center: overlay.getCenter().toArray(), radius: overlay.getRadius()};
			break;
		case 'rectangle':
			data = {bounds: overlay.getBounds().toArray()};
			break;
	}
	var save = {zkey: overlay.zkey, type: overlay.type, data: data};
	localStorage.setItem('zones.last.edit', JSON.stringify(save, '', '  '));
}

/* Восстанавливает последнее редактирование из локального хранилища */
function restoreFromLocal() {
	var data = localStorage.getItem('zones.last.edit');
	//localStorage.removeItem('zones.last.edit');
	if(data){
		data = JSON.parse(data);
		log('-- Restore editing from local storage', data);
		if(data.zkey in config.zones){
			var overlay = config.zones[data.zkey].overlay;
			zones_show();
			zones_activate();
			setSelection(overlay);
			switch(config.zones[data.zkey].type){
				case 'polygon':
				case 'polyline':
					var path = overlay.getPath();
					path.clear();
					data.data.map(function(el){
						path.push(new google.maps.LatLng(el[0], el[1]));
					});
					break;
				case 'circle':
					overlay.setCenter(new google.maps.LatLng(data.data.center[0], data.data.center[1]));
					overlay.setRadius(data.data.radius);
					break;
				case 'rectangle':
					overlay.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(data.data.bounds[0][0], data.data.bounds[0][1]), new google.maps.LatLng(data.data.bounds[1][0], data.data.bounds[1][1])));
					break;
			}
		}
	}
}

/* Отменяет сохранение */
function cancelFromLocal() {
	log('-- cancelFromLocal()');
	localStorage.removeItem('zones.last.edit');
}

function configEdit(newShape){
	google.maps.event.addListener(newShape, 'click', function() {
		setSelection(newShape);
	});
	if((newShape.type == 'polygon') || (newShape.type == 'polyline')){
		var vertices = newShape.getPath();
		google.maps.event.addListener(vertices, 'insert_at', function(index) {
			//log('Polygon event: insert_at', newShape, index);
			//log('TBD! Save new point is', vertices.getAt(index).toString());
			newShape.dirty = true;	// При снятии выделения необходимо сохранить зону.
			saveToLocal(newShape);
			//SaveZoneToServer(newShape);
		});
		google.maps.event.addListener(vertices, 'remove_at', function(index, el) {
			//log('Polygon event: remove_at', newShape, index, el);
			//log('TBD! Remove new point at index', index);
			//SaveZoneToServer(newShape);
			newShape.dirty = true;	// При снятии выделения необходимо сохранить зону.
			saveToLocal(newShape);
		});
		google.maps.event.addListener(vertices, 'set_at', function(index, el) {
			//log('Polygon event: set_at', newShape, index, el);
			//log('TBD! Save new point ', el.toString(), 'at index', index);
			//SaveZoneToServer(newShape);
			newShape.dirty = true;	// При снятии выделения необходимо сохранить зону.
			saveToLocal(newShape);
		});
	} else if(newShape.type == 'circle'){
		google.maps.event.addListener(newShape, 'radius_changed', function() {
			//log('Circle event: radius_changed', newShape);
			//log('TBD! Save new radius is', newShape.getRadius());
			//SaveZoneToServer(newShape);
			newShape.dirty = true;	// При снятии выделения необходимо сохранить зону.
			saveToLocal(newShape);
		});
		google.maps.event.addListener(newShape, 'center_changed', function() {
			//log('Circle event: center_changed', newShape);
			//log('TBD! Save new center is', newShape.getCenter().toString());
			//SaveZoneToServer(newShape);
			newShape.dirty = true;	// При снятии выделения необходимо сохранить зону.
			saveToLocal(newShape);
		});
	} else if(newShape.type == 'rectangle'){
		google.maps.event.addListener(newShape, 'bounds_changed', function() {
			//log('Rectangle event: bounds_changed', newShape);
			//log('TBD! Save new bounds is', newShape.getBounds().toString());
			//SaveZoneToServer(newShape);
			newShape.dirty = true;	// При снятии выделения необходимо сохранить зону.
			saveToLocal(newShape);
		});
	}
	//log('configEdit', newShape);
}

function LoadZones() {
	$.getJSON('/api/zone/get', function (data) {
		if (data.answer && data.answer == 'ok') {
			for(var i in zones){
				//if(zones[i].type == 'polygon'){
				zones[i].overlay.setMap(null);
				delete zones[i];
				//}
			}
			for(var i in data.zones){
				var zone = data.zones[i];
				var newShape;

				if(zone.type == 'polygon'){
					var path = [];
					for(var j in zone.points) path.push(new google.maps.LatLng(zone.points[j][0], zone.points[j][1]));
					newShape = new google.maps.Polygon({
						//map: window.config.map,
						path: path,
						clickable: false,
						strokeColor: "#FF0000",
						strokeOpacity: 0.8,
						strokeWeight: 1,
						fillColor: "#FF0000",
						fillOpacity: 0.35
					});
				} else if(zone.type == 'circle'){
					newShape = new google.maps.Circle({
						//map: window.config.map,
						center: new google.maps.LatLng(zone.points[0][0], zone.points[0][1]),
						radius: zone.radius,
						clickable: false,
						strokeColor: "#FF0000",
						strokeOpacity: 0.8,
						strokeWeight: 1,
						fillColor: "#FF0000",
						fillOpacity: 0.35
					});
				} else if(zone.type == 'rectangle'){
					newShape = new google.maps.Rectangle({
						//map: window.config.map,
						bounds: new google.maps.LatLngBounds(new google.maps.LatLng(zone.points[0][0], zone.points[0][1]), new google.maps.LatLng(zone.points[1][0], zone.points[1][1])),
						clickable: false,
						strokeColor: "#FF0000",
						strokeOpacity: 0.8,
						strokeWeight: 1,
						fillColor: "#FF0000",
						fillOpacity: 0.35
					});
				} else if(zone.type == 'polyline'){
					var path = [];
					for(var j in zone.points) path.push(new google.maps.LatLng(zone.points[j][0], zone.points[j][1]));
					newShape = new google.maps.Polyline({
						//map: window.config.map,
						path: path,
						clickable: false,
						strokeColor: "#FF0000",
						strokeOpacity: 0.8,
						strokeWeight: 2,
						fillColor: "#FF0000",
						fillOpacity: 0.35
					});
				} else continue;

				zones[zone.zkey] = zone;
				zones[zone.zkey]['overlay'] = newShape;
				newShape['zkey'] = zone.zkey;
				newShape['type'] = zone.type;
				configEdit(newShape);
			}
			update_zone_list();
			restoreFromLocal();
		}
	});
}

function SaveZoneToServer(overlay) {
	var points = [];

	if(overlay.zkey) {
		log('Complete editing zone. Saving...', overlay);
	} else {
		log('Complete drawing zone. Saving...', overlay);
	}

	if((overlay.type == 'polygon') || (overlay.type == 'polyline')){
		var vertices = overlay.getPath();
		for(var i=0; i<vertices.length; i++) {
			var p = vertices.getAt(i)
			points.push([p.lat(), p.lng()]);
		}
	} else if(overlay.type == 'circle'){
		/* Для совместимости с db.GeoPt Circle сохраняется в виде Center, Bounds (2 координаты) и [радиус, радиус] */
		var p = overlay.getCenter();
		points.push([p.lat(), p.lng()]);
		var b = overlay.getBounds()
		p = b.getSouthWest();
		points.push([p.lat(), p.lng()]);
		p = b.getNorthEast();
		points.push([p.lat(), p.lng()]);
		p = overlay.getRadius();
		points.push([p, p]);
		// Длина экватора - 40075,696 км, поэтому максимально возможный радиус ~ 20040000 	метров
		//log('Radius=', overlay.getRadius(), overlay.getRadius()/20000000);
		//log('Bounds=', b.toString());
	} else if(overlay.type == 'rectangle'){
		var p = overlay.getBounds().getSouthWest();
		points.push([p.lat(), p.lng()]);
		p = overlay.getBounds().getNorthEast();
		points.push([p.lat(), p.lng()]);
	} else {
		log('Error! Unsupported zone type.');
		return;
	}

	$.ajax({
  		url: '/api/zone/add',
		dataType: 'json',
		data: {type: overlay.type, points: JSON.stringify(points), zkey: overlay.zkey, bounds: JSON.stringify(overlay.getBounds().toArray())},
		type: 'post',
		success: function(data){
			if(data && data.answer == 'ok'){
				log('Add polygon to zkey or modify it');
				if(!overlay.zkey){
					zones[data.zkey] = {};
					zones[data.zkey]['overlay'] = overlay;
					zones[data.zkey]['zkey'] = data.zkey;
					zones[data.zkey]['type'] = overlay.type;
					update_zone_list();
					//newShape['zkey'] = zone.zkey;
					//newShape['type'] = zone.type;
				}
				overlay.zkey = data.zkey;

				// Нужно сохранить zkey созданного полигона.
				//polygon['zkey'] = data.zkey;
				//if(!('zones' in config)) config['zones'] = {};
				//zones[data.zkey] = {type: 'polygon', polygon: polygon}
				//update_zone_list();
			}
		}
	});
}

function ZoneKit() {
	// TBD! Стоит переделать на отложенную загрузку зон только если пользователь активизировал отображение или редактор.
	LoadZones();
	//restoreFromLocal();

/*
	Проба гугловского редактора зон.
*/
	var polyOptions = {
		strokeWeight: 0,
		fillOpacity: 0.45,
		editable: true
	};

// Создаем drawing manager на карте config.map который позволит рисовать линии, круги, прямоугольники и полигоны.

	drawingManager = new google.maps.drawing.DrawingManager({
		//drawingMode: google.maps.drawing.OverlayType.POLYGON,
		drawingControl: false,		// По-умолчанию менеджер скрыт, для отображения менеджера нужно вызвать drawingManager.setOptions({drawingControl: true});

		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_CENTER,
			drawingModes: [google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.RECTANGLE]
		},
		polylineOptions: {
			editable: true
		},
		rectangleOptions: polyOptions,
		circleOptions: polyOptions,
		polygonOptions: polyOptions,
		map: config.map
	});

	/* После создания зоны будет вызвана данная функция */
	google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
		var newShape = e.overlay;

		if(e.type == google.maps.drawing.OverlayType.POLYGON){
			newShape.type = 'polygon';
		} else if(e.type == google.maps.drawing.OverlayType.CIRCLE){
			newShape.type = 'circle';
		} else if(e.type == google.maps.drawing.OverlayType.POLYLINE){
			newShape.type = 'polyline';
		} else if(e.type == google.maps.drawing.OverlayType.RECTANGLE){
			newShape.type = 'rectangle';
		}
		SaveZoneToServer(newShape);
                
		// Switch back to non-drawing mode after drawing a shape.
		drawingManager.setDrawingMode(null);

		configEdit(newShape);

		// Add an event listener that selects the newly-drawn shape when the user
		// mouses down on it.
		//newShape.type = e.type;
		//google.maps.event.addListener(newShape, 'click', function() {
		//	setSelection(newShape);
		//});
		setSelection(newShape);
        });

	if(0){
		// To hide:
		drawingManager.setOptions({
			drawingControl: false
		});

		// To show:
		drawingManager.setOptions({
			drawingControl: true
		});
	}

// Clear the current selection when the drawing mode is changed, or when the
        // map is clicked.
	google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
	google.maps.event.addListener(map, 'click', clearSelection);
	google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', deleteSelectedShape);

	buildColorPalette();

}

var zone_showed = false;

var zones_show = function(){
	zone_showed = true;
	$('#map_zone_show>span').css('background-color', 'lime');
	for(var i in zones){
		zones[i].overlay.setMap(window.config.map);
	}
}

var zones_hide = function(){
	zone_showed = false;
	$('#map_zone_show>span').css('background-color', '');
	for(var i in zones){
		zones[i].overlay.setMap(null);
	}
}

ZoneKit.prototype.Show = function(){
	if(!zone_showed){
		zones_show();
	} else {
		zones_hide();
	}
	//update_zone_list();
}

var track_edit_mode = false;

var zones_activate = function(){
	for(var i in zones){
		var zone = zones[i];
		zone.overlay.setOptions({clickable: true});
		//if(zone.type == 'polygon'){
		var eventsclick = google.maps.event.addListener(zone.overlay, 'mouseover', function(event){
			if('zkey' in this) $('#map_zones_list li[zkey='+this.zkey+']').addClass('highlight');
			this.setOptions({strokeWeight: 4});
		});
		var eventsleave = google.maps.event.addListener(zone.overlay, 'mouseout', function(event){
			if('zkey' in this) $('#map_zones_list li[zkey='+this.zkey+']').removeClass('highlight');
			if(this.type == 'polyline') {
				this.setOptions({strokeWeight: 2});
			} else {
				this.setOptions({strokeWeight: 1});
			}
		});
		//}
	}
}

var zones_deactivate = function(){
	clearSelection();
	for(var i in zones){
		var zone = zones[i];
		if(zone.type == 'polyline') {
			zone.overlay.setOptions({clickable: false, strokeWeight: 2});
		} else {
			zone.overlay.setOptions({clickable: false, strokeWeight: 1});
		}
	}
}

ZoneKit.prototype.Edit = function(){
	var self = this;
	if($('#zone_panel').css('display') == 'none'){
		$('#map_zone_edit>span').css('background-color', 'lime');

		$('#zone_panel').show('fast');
		$('#zone_edit_panel').show();
		zones_show();
		zones_activate();
		drawingManager.setOptions({drawingControl: true});

	} else {
		$('#map_zone_edit>span').css('background-color', '');
		$('#zone_panel').hide('fast');
		$('#zone_edit_panel').hide();
		zones_deactivate();
		drawingManager.setOptions({drawingControl: false});
	}
}

window['ZoneKit'] = ZoneKit;

//$(window).unload(function(){log("Don't forget save edited zones.");});
//$(window).unload( function () { clearSelection(); } );	// Сохранение результатов редактирования при выходе. Хрен знает получится или нет.

})(window, jQuery);

