/*
	Работа со списком систем.
	Чего бы хотелось.
	1. Генерация списка по пользовательскому шаблону.
	2. Автоматическая перегенерация списка при изменении в системых (по внешнему событию).
*/

/*
	TBD! Устаревший механизм. Необходимо переделать на новый.
*/
if(0){
var config = window.config;
if(0){
config.syslist = function(options){
	var list = $('#'+options.id);

	var Make_SysList = function(){
		list.empty();
		for(var i in config.systems){
			var s = config.systems[i];
			//list.append('<option imei="'+s.imei+'" value="'+s.skey+'"'+(config.skey==s.skey?' selected':'')+'>'+s.desc+'</option>');
			list.append('<option imei="'+s.imei+'" value="'+s.skey+'">'+s.desc+'</option>');
		}
	}

	Make_SysList();

	$(list).bind({
		/*click: function(ev){
			Make_SysList();
			log('click');
			},*/
		change: options.change
	});

	config.updater.add('changeslist', function(msg) {
		log('config.syslist: Update system list');
		Make_SysList();
	});

	config.updater.add('changedesc', function(msg) {
		$(list).children('option[value="'+msg.data.skey+'"]').html(msg.data.desc);
	});

}
}

// TBD! Мне не нравится это повторное считывание списка. Лучше сделать локальное обновление (только изменившиеся данные)

var UpdateAccountSystemList = function() {
	$.getJSON('/api/info', function (data) {
		if(data){
			log('UpdateAccountSystemList data:', data);
			//var config = config || {};
			config.systems = [];
			config.sysbykey = {};
			for(var i in data.info.account.systems){
				var s = data.info.account.systems[i];
				config.systems.push({
					'imei': s.imei,
					'skey': s.key,
					'desc': s.desc
				});
				config.sysbykey[s.key] = {imei: s.imei, desc: s.desc};
			}

			config.updater.process({msg: 'changeslist'});
		}
	});
}



//UpdateAccountSystemList();

config.updater.add('change_slist', function(msg) {
	log('BASE: Update system list');
	UpdateAccountSystemList();
});
}


(function( window, $, undefined ) {
var document = window.document;
var lists_count = 0;

function clone(o) {
	if(!o || 'object' !== typeof o) {
		return o;
	}
	if('function' === typeof o.pop) return o.splice(0);
	var c = {};
	for(var p in o) {
		if(o.hasOwnProperty(p)) {
			var v = o[p];
			if(v && 'object' === typeof v) {
				c[p] = clone(v);
			} else {
				c[p] = v;
			}
		}
	}
	return c;
}

config.updater.add('change_desc', function(msg) {
	config.sysbykey[msg.skey].desc = msg.data.desc;
});

config.updater.add('change_slist', function(msg) {
	log('global SysList: change_slist.', msg);
	switch(msg.data.type){
		case 'Adding':
			if(!(msg.data.system.key in config.sysbykey)){
				var system = clone(msg.data.system);
				config.account.systems.push(system);
				config.sysbykey[system.key] = system;
			}

		break;
	}
	//var s = msg.data.system;
});

function SysList(elementid){
	var me = this;
	lists_count += 1;
	this.listnum = lists_count;
	this.elementid = elementid;

	log('SysList: init', elementid, this);
	
	//$(document).ready(function() {
	me.element = document.getElementById(me.elementid);
	me.nodename = me.element.nodeName.toLowerCase();
	//me.Rebuild();
	//});
	if(me.nodename == 'select'){
		//var me = this;
		this.element.addEventListener('change', function(e){
			console.log('SysList: change event', e, e.target.selectedIndex);
			me.selectSys(window.config.account.systems[e.target.selectedIndex]);
		});
	}


	config.updater.add('change_slist', function(msg) {
		log('SysList: change_slist. Update system list.', msg);
		me.Rebuild();
	});

	config.updater.add('change_desc', function(msg) {
		log('SysList: change_desc. Update system description.', msg);
		me.changeItem(msg.skey, msg.data.desc);
		//$(list).children('option[value="'+msg.data.skey+'"]').html(msg.data.desc);
	});
}

SysList.prototype.Rebuild = function(){
	//log('SysList: rebuild', this, lists_count, this.listnum);
	this.start();
	for(var i in window.config.account.systems){
		var s = window.config.account.systems[i];
		this.addItem(s);
	}
	this.finish();
}

SysList.prototype.start = function(){
	this.element = this.element || document.getElementById(this.elementid);
	log('SysList: start', this);
	//document.getElementById('log_syslist')
	// Удалить все элементы если они есть.
	config.helper.empty(this.element);
	/*while (this.element.firstChild) {
		this.element.removeChild(this.element.firstChild);
	}*/
}

SysList.prototype.addItem = function(s){
//	if(this.nodename == 'select') {
	if(/^select$/i.test(this.element.nodeName)) {
		var option = document.createElement('option');
		option.dataset.imei = s.imei;
		option.dataset.skey = s.skey;
		option.title = 'IMEI: ' + s.imei;
		option.innerHTML = s.desc;
		this.element.appendChild(option);
	} else {
		log('SysList: Warning! You must define addItem method');
	}
}

SysList.prototype.finish = function(){
	//log('SysList: finish');
}

SysList.prototype.selectSys = function(system){
	log('SysList: Warning! You must define selectSys method', system);
}


SysList.prototype.changeItem = function(skey, desc){
	log('SysList.changeItem', this.element);

	var node = this.element.querySelector('*[data-skey="'+skey+'"]');

	// Я не знаю как выбирать текстовые ноды через селектор, поэтому перебор
	[].forEach.call(node.childNodes, function(el){
		if(el.nodeType === Node.TEXT_NODE) el.data = desc;
	});

	//for(var i=0; i<this.element.childNodes.length; i++){	// Пройдемся по всем элементам списка.
		//var node=this.element.childNodes[i];
		//log('   -> node', node);
/*
	for(var j=0; j<node.childNodes.length; j++){
		var elnode = node.childNodes[j];
		//log('   -> elnode', elnode);
		if(elnode.nodeType === Node.TEXT_NODE){
			log('     -> text Node');
			elnode.data = desc;
		}
	}
*/
	//}
/*
	if(/^select$/i.test(this.element.nodeName)) {
		var p = this.element.querySelector('option[data-skey='+skey+']');
		if(p){
			//p.innerHTML = desc;
			p.firstChild.textContent = desc;	// Вот почему-то мне не нравится использовать innerHTML
		}
		//log('change item:', p, this.element);
	} else {
		log('SysList: Warning! You must define changeItem method', skey, desc);
	}
*/
}

SysList.prototype.deleteItem = function(){
	log('SysList: Warning! You must define deleteItem method');
}

config.updater.add('changedesc', function(msg) {
	//log('Обработчик события для обновления списка config.systems', msg);
	for(var i in config.systems){
		if(config.systems[i].skey == msg.data.skey){
			config.systems[i].desc = msg.data.desc;
		}
	}
	if(msg.data.skey in config.sysbykey){
		config.sysbykey[msg.data.skey].desc = msg.data.desc;
	}
	//log('CONFIG==', config);
});


window['SysList'] = SysList;

})(window, jQuery);

