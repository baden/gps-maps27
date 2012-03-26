define(['plugins/text!t/report.html'], function(template){
var View = Backbone.View.extend({
	me: null
	, template: _.template(template)

	// Вызывается при первом создании виджета.
	, create: function (div) {
		log('create report vidget');

		var data = {};	// наши данные для отрисовки шаблона
		
		this.me = div;
		div.innerHTML = this.template(data);


      /* Update datepicker plugin so that MM/DD/YYYY format is used. */
      $.extend($.fn.datepicker.defaults, {
        parse: function (string) {
          var matches;
          if ((matches = string.match(/^(\d{2,2})\/(\d{2,2})\/(\d{4,4})$/))) {
            return new Date(matches[3], matches[1] - 1, matches[2]);
          } else {
            return null;
          }
        },
        format: function (date) {
          var
            month = (date.getMonth() + 1).toString(),
            dom = date.getDate().toString();
          if (month.length === 1) {
            month = "0" + month;
          }
          if (dom.length === 1) {
            dom = "0" + dom;
          }
          return dom + "/" + month + "/" + date.getFullYear();
        },
    monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                 "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
  , shortDayNames: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

      });  

		$(div).find('[data-datepicker="datepicker"]').datepicker();

		log('iskey', $(div).find('a.iskey'));

		$(div).find('a.iskey').bind('click', function(event){
			log('click');
			//event.preventDefault();
		});

	}

	// Вызывается при активизации закладки
	, tabto: function () {
		log('back to report');
	}

});

return View;
});
