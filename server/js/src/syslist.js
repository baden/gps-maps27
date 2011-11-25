/*
	Работа со списком систем.
	Чего бы хотелось.
	1. Генерация списка по пользовательскому шаблону.
	2. Автоматическая перегенерация списка при изменении в системых (по внешнему событию).
*/

(function( window, $, undefined ) {

var lists_count = 0;

function SysList(){
	var me = this;
	lists_count += 1;
	this.listnum = lists_count;
	log('SysList: init', lists_count, this.listnum);
	
	$(document).ready(function() {
		me.Rebuild();
	});
}

SysList.prototype.Rebuild = function(){
	log('SysList: rebuild', this, lists_count, this.listnum);
	this.start();
	for(var i in window.config.account.systems){
		var s = window.config.account.systems[i];
		this.addItem(s);
	}
	this.finish();
}

SysList.prototype.start = function(){
	log('SysList: start');
}

SysList.prototype.addItem = function(){
	log('SysList: Warning! You must define addItem method');
}

SysList.prototype.finish = function(){
	log('SysList: finish');
}

window['SysList'] = SysList;

})(window, jQuery);

