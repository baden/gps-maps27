"use strict";

log('Грузимся.');

function loadCss(id, src) {
	//log('loadCss', id, src);

	var imprt = document.getElementById(id);
	if(imprt) return;
	imprt = document.createElement('style');
	imprt.setAttribute("type", "text/css");
	imprt.id = id;
	if (imprt.styleSheet) imprt.styleSheet.cssText = src;
	else imprt.appendChild(document.createTextNode(src));
	document.getElementsByTagName('head')[0].appendChild(imprt);
}
//require(['lib/newlib', 'views/map', 'views/logs'], function(newlib, Map, Logs) {
require(
['plugins/domReady', 'lib/base', 'views/map', 'views/report', 'views/logs', 'views/geos', 'views/configs', 'views/help'],
function(domReady, base, Map, Report, Logs, Geos, Configs, Help) {
//log('newlib:', newlib);
//log('foo:', newlib.foo({a: 'ololo'}));
domReady(function(){

	base.init();

	var block = document.getElementById('block');	// Блок куда будут добавляться страницы.

	var tabViews = {
		Map: new Map()
		, Report: new Report()
		, Logs: new Logs()
		, Geos: new Geos()
		, Configs: new Configs()
		, Help: new Help()
	};
	//log('tabViews', tabViews);

	var Router = Backbone.Router.extend({
		routes: {
		'': 'map'
		, 'map': 'map'
		, 'report': 'report'
		, 'logs': 'logs'
		, 'logs/:page': 'logs'
		, 'geos': 'geos'
		, 'geos/:page': 'geos'
		, 'configs': 'configs'
		, 'help': 'help'
		}
		, map: function(){
			//log('map', Map);
			this.show_view(tabViews.Map, 'map');
		}
		, report: function(){
			//log('map', Report);
			this.show_view(tabViews.Report, 'report');
		}
		, logs: function(page){
			//log('logs', page);
			this.show_view(tabViews.Logs, 'logs', page);
		}
		, geos: function(page){
			//log('geos', page);
			this.show_view(tabViews.Geos, 'geos', page);
		}
		, configs: function(page){
			//log('configs', page);
			this.show_view(tabViews.Configs, 'configs', page);
		}
		, help: function(page){
			//log('help', page);
			this.show_view(tabViews.Help, 'help', page);
		}
		, show_view: function(View, view_name, arg1, arg2) {
			//log('Map', View, view_name, arg1, arg2);
			this.current_view = View;
			
			$('ul.nav li').removeClass('active');
			if (view_name) {
				$('#'+view_name+'_item').addClass('active');
			}

			// Погасим все элементы в блоке block
//			[].forEach.call(block.childNodes, function(){
//			});
			var view = null;
			_.each(block.childNodes, function(el){
				//log('el', el);
				if(el.id == 'loading') {
					block.removeChild(el);
				} else {
					if(el.id == view_name) {
						//el.classList.remove
						$(el).removeClass('hidden');
						view = el;
					} else {
						$(el).addClass('hidden');
					}
				}
			});

			if(!view) {
				var div = document.createElement('div');
				div.id = view_name;
				this.current_view.create(div, arg1, arg2);
				block.appendChild(div);
			}
			this.current_view.tabto(arg1, arg2);

			//this.current_view.render();
		}

		, initialize: function(options) {
			log('Route initialize', options);
			//this.route("page/:number", "page", function(number){ 
			// });
			this.route(/^(.*?)\/open$/, "logs");
			//, /^(.*?)\/open$/: 'logs'
		}
	});

window.router = new Router();
Backbone.history.start();

});

});


//log('Бум.');
