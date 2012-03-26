define(['plugins/text!t/configs.html', 'plugins/text!t/configs.css'], function(template, css){
var View = Backbone.View.extend({
	me: null
	, template: _.template(template)

	// Вызывается при первом создании виджета.
	, create: function (div) {
		log('create configs vidget');

		loadCss('css_config', css);

		var data = {};	// наши данные для отрисовки шаблона
		
		this.me = div;
		div.innerHTML = this.template(data);
	}

	// Вызывается при активизации закладки
	, tabto: function () {
		log('back to configs');
	}
});
return View;
});
