define(['plugins/text!t/logs.html'], function(template){
var View = Backbone.View.extend({
	me: null
	, template: _.template(template)

	// Вызывается при первом создании виджета.
	, create: function (div) {
		log('create logs vidget');

		var data = {};	// наши данные для отрисовки шаблона
		
		this.me = div;
		div.innerHTML = this.template(data);
		$(div).find('.dropdown-toggle').dropdown();
		log("$('div *.dropdown-toggle')=", $(div).find('.dropdown-toggle'));
	}

	// Вызывается при активизации закладки
	, tabto: function(skey) {
		log('back to logs', skey);
		setTimeout(function(){
			//$().dropdown();
			//$('.dropdown-toggle').dropdown();
		}, 0);
	}
});

return View;
});
