// Выполняется после всех скриптов

(function(window) {
	
	$("button").button();		// Декорируем кнопки.

	var show = function(index){
		log('TAB: show: ', index, $(this));
		log('config:', config.updater);
		config.tab = index;
		if(('tabs' in config.updater) && (config.updater.tabs[index])) {
			if(config.inits){
				log('TAB: show in inits: ', index, $(this));
				config.inits.push(function(){
					log('TAB: show in inits: ', index, $(this));
					config.updater.tabs[index]();
				});
			} else {
				log('TAB: show direct: ', index, $(this));
				config.updater.tabs[index]();
			}
		} else {
			log('TAB: no tabs', config.updater, config.updater.tabs[index]);
		}
	}

	log('tabs init');

	var $tabs = $("#tabs").tabs({
		cookie: { expires: 30, name: 'maintab' },
		//effect: 'ajax',
		cache: true,
		spinner: 'Retrieving data...',
		show: function(){
			show($(this).tabs( "option", "selected" ));
		}/*,
		load: function(){
			log('TAB: tab loaded: ', $(this).tabs( "option", "selected" ));
			$("button").button();
		}*/
	});
	//var connected = false;
})(window);
