/*
	Работа со списком систем.
	Чего бы хотелось.
	1. Генерация списка по пользовательскому шаблону.
	2. Автоматическая перегенерация списка при изменении в системых (по внешнему событию).
*/

(function( window, $, undefined ) {
var document = window.document;
var lists_count = 0;

config.updater.add('change_desc', function(msg) {
	config.account.systems[msg.skey].desc = msg.data.desc;
});

config.updater.add('change_slist', function(msg) {
	log('global SysList: change_slist.', msg);
	switch(msg.data.type){
		case 'Adding':
			if(!(msg.data.system.key in config.account.systems)){
				var system = config.helper.clone(msg.data.system);
				//config.account.systems.push(system);
				config.account.systems[system.skey] = system;
				config.account.sys_keys.push(system.skey);
				//config.sysbykey[system.key] = system;
			}
			break;
		case 'Deleting':
			delete config.account.systems[msg.data.skey];
			var i = config.account.sys_keys.indexOf(msg.data.skey);
			if(i>=0) config.account.sys_keys.splice(i, 1);
			/*var i=-1;
			for(var k in config.account.systems){
				if(config.account.systems[k].key == msg.data.skey) i = k;
			}
			if(i>=0) config.account.systems.splice(i, 1);*/
			break;
		case 'Sorting':
			//log('== TBD! Sorting', msg);
			config.account.sys_keys = msg.data.slist;
			break;
	}
	//var s = msg.data.system;
});

var tags = {};
config.inits.push(function(){

for(var k in config.account.systems) {
	for(var t in config.account.systems[k].tags)
		tags[config.account.systems[k].tags[t]] = 1;
}

});

function SysList(elementid, handlers){
	var me = this;

	me.handlers = {};
	for(var k in me.default_handlers) me.handlers[k] = me.default_handlers[k];
	//if(handlers) {
	for(var k in handlers) me.handlers[k] = handlers[k];
	//}
	lists_count += 1;
	me.listnum = lists_count;
	me.elementid = elementid;

	log('SysList: init', elementid);
	
	//$(document).ready(function() {
	me.element = document.getElementById(me.elementid);
	me.nodename = me.element.nodeName.toLowerCase();
	me.Rebuild();

	//me.taggroup = null;
	if(me.handlers.taggroupid) {
		me.taggroup = document.getElementById(me.handlers.taggroupid);
		log('exist', me.taggroup);
	} else {
		if(me.nodename == 'select'){
			me.taggroup = document.createElement('select');
		}
	}

	if(me.taggroup) {
		var tagHTML = '<option>Все</option>';
		//me.taggroup = document.createElement('select');
		for(var t in tags) {
			tagHTML += '<option>'+t+'</option>';
		}
		me.taggroup.innerHTML = tagHTML;

		//log('me.taggroup', me.taggroup);

		if(me.nodename == 'select'){
			me.element.parentNode.insertBefore(me.taggroup, me.element);
		}

		me.taggroup.addEventListener('change', function(e) {
			var index = this.selectedIndex;
			var tag = this.value;
			//log('Change group for tag', tag);
			//console.dir(this);
			/*
				Скрыть все элементы(системы), у кого нет данного ярлыка (открыть все остальные)
			*/
			for(var i=0, l=me.element.childNodes.length; i<l; i++){
				var node = me.element.childNodes[i];
				//log('node', node);
				if((index==0) || ((config.account.systems[node.dataset.skey].tags.indexOf(tag))!=-1)) {
					node.style.display = '';
				} else {
					node.style.display = 'none';
				}
			}
			if(me.nodename == 'select'){
				me.element.selectedIndex = 0;
				var evt = document.createEvent("HTMLEvents");	// Вызовем обработчик "onchange"
				evt.initEvent('change', true, true)
				me.element.dispatchEvent(evt);
			}
			if(me.handlers.tagchange) me.handlers.tagchange.call(me, tag, index);
		});
		config.updater.add('change_tag', function(msg) {
			log('SysList: change_tag. Update system tags.', msg);
			config.account.systems[msg.skey].tags = msg.data.tags.slice();
			for(var t in msg.data.tags) {
				log('tag', t, msg.data.tags[t]);
				if(!(msg.data.tags[t] in tags)) {
					tags[msg.data.tags[t]] = 1;
					//var option = document.
					me.taggroup.appendChild(new Option(msg.data.tags[t]));
					log('append', me.taggroup);
				}
			}
			//me.Rebuild();
		});

	}


	//});
	if(me.nodename == 'select'){
		//var me = this;
		me.element.addEventListener('change', function(e){
			console.log('SysList: change event', e, window.config.account.sys_keys[e.target.selectedIndex]);
			//me.selectSys(window.config.account.systems[e.target.selectedIndex]);
			me.handlers.select(window.config.account.systems[window.config.account.sys_keys[e.target.selectedIndex]]);
		});
	}

	config.updater.add('change_slist', function(msg) {
		//log('SysList: change_slist. Update system list.', msg);
		me.Rebuild();
	});

	config.updater.add('change_desc', function(msg) {
		//log('SysList: change_desc. Update system description.', msg);
		me.handlers.change.call(me, msg.skey, msg.data.desc);
	});
}

SysList.prototype.default_handlers = {
	start: function(){
		this.element = this.element || document.getElementById(this.elementid);
		//log('SysList: start', this);
		//document.getElementById('log_syslist')
		// Удалить все элементы если они есть.
		//config.helper.empty(this.element);
		while (this.element.firstChild) {
			this.element.removeChild(this.element.firstChild);
		}
		//var helper = document.createElement('option');
		//helper.innerText = 'Выберите';
		//this.element.appendChild(helper);
	},
	element: function(s){
		//log('SysList.element', this, s);
		if(/^select$/i.test(this.element.nodeName)) {
			var option = document.createElement('option');
			//option.dataset.imei = s.imei;
			//option.dataset.skey = s.skey;
			option.title = 'IMEI: ' + s.imei.replace(/-.*/,'');
			option.innerHTML = s.desc;
			//this.element.appendChild(option);
			return option;
		} else {
			log('SysList: Warning! You must define handlers.item method');
		}
	},
	finish: function(){
		//log('SysList: finish');
	},
	select: function(system){
	},
	change: function(skey, desc){
		//log('SysList.changeItem', this, skey, desc);
		var node = this.element.querySelector('*[data-skey="'+skey+'"]');
		// Я не знаю как выбирать текстовые ноды через селектор, поэтому перебор
		[].forEach.call(node.childNodes, function(el){
			if(el.nodeType === Node.TEXT_NODE) el.data = desc;
			else if(el.classList.contains('description')) el.innerText = desc;
		});
	},
	additem: function(s){
		var el = this.handlers.element.call(this, s);
		//log('SysList:additem', el, this);
		/*if(el.dataset){		// TDB! Как-то ведь можно применить polyfills? (http://addyosmani.com/blog/writing-polyfills/)
			el.dataset.skey = s.key;
			el.dataset.imei = s.imei;
		} else {
			el.setDataAttribute('skey', s.key);
			el.setDataAttribute('imei', s.imei);
		}*/
		el.setDataAttribute('skey', s.key);
		el.setDataAttribute('imei', s.imei);

		this.element.appendChild(el);
	},
	remove: function(skey){
		log('SysList: Warning! You must define remove handler');
	}
}

SysList.prototype.Rebuild = function(){
	log('SysList.prototype.Rebuild');
	this.handlers.start.call(this);
	//for(var i in window.config.account.systems){
	for(var i in window.config.account.sys_keys){
		var s = window.config.account.systems[window.config.account.sys_keys[i]];
		this.handlers.additem.call(this, s);
	}
	this.handlers.finish.call(this);
}

config.updater.add('changedesc', function(msg) {
	//log('Обработчик события для обновления списка config.account.systems', msg);
	for(var i in config.account.systems){
		//if(config.account.systems[i].skey == msg.data.skey){
		if(i == msg.data.skey){
			config.account.systems[i].desc = msg.data.desc;
		}
	}
	if(msg.data.skey in config.account.systems){
		config.account.systems[msg.data.skey].desc = msg.data.desc;
	}
	//log('CONFIG==', config);
});


window['SysList'] = SysList;

})(window, jQuery);

