define(['plugins/text!t/help.html'], function(template){
var View = Backbone.View.extend({
	me: null
	, template: _.template(template)

	// Вызывается при первом создании виджета.
	, create: function (div) {
		log('create help vidget');

		var data = {};	// наши данные для отрисовки шаблона
		
		this.me = div;
		div.innerHTML = this.template(data);
	}

	// Вызывается при активизации закладки
	, tabto: function () {
		log('back to help');
	}

});

return View;
});
