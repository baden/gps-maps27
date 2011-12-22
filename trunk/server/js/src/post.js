// Выполняется после всех скриптов

(function(window) {
	//config.inits.map(function(single){single();});
		
	$("button").button();		// Декорируем кнопки.

	var $tabs = $("#tabs").tabs({
		cookie: { expires: 30, name: 'maintab' },
		//effect: 'ajax',
		cache: true,
		spinner: 'Retrieving data...',
		show: function(){
			var index = $(this).tabs( "option", "selected" );
			//log('TAB: show: ', index, $(this));
			//log('config:', config);
			config.tab = index;
			if(('tabs' in config.updater) && (config.updater.tabs[index])) config.updater.tabs[index]();
		}/*,
		load: function(){
			log('TAB: tab loaded: ', $(this).tabs( "option", "selected" ));
			$("button").button();
		}*/
	});
	//var connected = false;
})(window);
