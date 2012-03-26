define(['plugins/text!t/map.html', 'plugins/text!t/map.css', 'lib/map/map'], function(template, css, _map){

var map;

var View = Backbone.View.extend({
	me: null
	, mapdiv: null
	, template: _.template(template)
//	, lib2: require('lib/map/map')

	// Вызывается при первом создании виджета.
	, create: function (div) {
		log('create map vidget', _map, this);

		loadCss('css_map', css);

		var data = {};	// наши данные для отрисовки шаблона
		
		var me = this.me = div;
		//$(div).addClass('mainmap');
		div.innerHTML = this.template(data);

		var mapdiv = this.mapdiv = div.querySelector('.main_map');
		mapdiv.style.height = '' + ($(window).height() - mapdiv.offsetTop - 2) + 'px';

		log('mapdiv', mapdiv, this.mapdiv);

		/*
			Создание карты
		*/
		//var $map = $('#map').gmap({
		var $map = $(mapdiv).gmap({
			pos: new google.maps.LatLng(48.5000, 34.599) // Default position - Ukraine
			, zoom: 8
			//marker: 'center',
			, maptype: google.maps.MapTypeId.ROADMAP
			, markertitme: 'aaa'
		});
		map = $($map).gmap('option', 'map');
		log('map = ', map);

		$(window).resize(function(){
			if(me.className.search('hidden') == -1) mapdiv.style.height = '' + ($(window).height() - mapdiv.offsetTop - 2) + 'px';
		})
	}

	// Вызывается при активизации закладки
	, tabto: function () {
		var mapdiv = this.mapdiv;
		log('back to map', map, this, mapdiv);
		setTimeout(function(){
			google.maps.event.trigger(map, 'resize');
			mapdiv.style.height = '' + ($(window).height() - mapdiv.offsetTop - 2) + 'px';
		}, 0);
	}
});

// Тут можно совершить и другие действи при желании

return View;

});
