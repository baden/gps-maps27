/*
*/
(function(window, $){

var document = window.document;

var sendGet = function(url) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.send();
}
var sendPost = function(url, body) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.send(body);
}
var saveconfig = function(it, val){
	$('#button_config_restart').button( "option", "disabled", true );
	if(val) config.ui[it] = val;
	$.ajax({
		url: '/api/system/config',
		dataType: 'json',
		data: config.ui,
		type: 'POST',
		success: function(){
			//log('Saved.');
			$('#button_config_restart').button( "option", "disabled", false );
		}
	});
}

var span = function(tag, title) {
	var span_el = document.createElement('span');
	span_el.className = 'ui-widget ui-state-default ui-corner-all ui-button ui-button-text-only tags';
	span_el.title = title;
	span_el.innerText = tag;
	return span_el;
	//log('span', span);
}


var ConfigList;

var cancel_alarm = function(){
	var skey = this.parentNode.dataset.skey;		// Лучший способ доступа к dataset !
	$.getJSON('/api/alarm/cancel?skey=' + skey, function (data) {
		log('Alarm canceled.');
	});
}

var ch_desc = function(){
	//alert(this.attributes['imei'].value);
	//var i = this.attributes['index'].value;
	var li = this.parentNode.parentNode;
	var imei = li.dataset.imei;
	var skey = li.dataset.skey;
	var olddesc = li.querySelector('.description').innerText;

	var dialog_div = config.helper.element_by_html(''+
	'<div title="Администрирование">'+
	'	Введите описание для системы:<b>'+(imei.replace(/-.*/,''))+'</b><br>'+
       	'	<textarea style="width:98%; resize: none;" rows="1">'+olddesc+'</textarea>'+
	'</div>'+
	'');

	$(dialog_div).find('textarea').keypress(function(ev){
		if(ev.which == 13) {
			//log('TEXTAREA_13:', $(this).parents('div[role="dialog"]').find('button').first());
			$(this).parents('div[role="dialog"]').find('button').first().click();
			return false;
		}
		return true;
	});


	$(dialog_div).dialog({
		width: 500,
		height: 150,
		modal: true,
		autoOpen: true,
		buttons: {
			'Применить изменения.': function() {
				var dialog = $(this);
				var desc = dialog.find('textarea').val();
				if(desc != olddesc){
					li.querySelector('.description').innerText = desc;
					$.getJSON('/api/sys/desc?skey=' + skey + '&desc=' + encodeURIComponent(desc), function (data) {
						if(data.result){
							var result = data.result;
							if(result == "disabled"){
								alert('Изменение описание заблокировано.');
								li.querySelector('.description').innerText = olddesc;
							} else if(result == "ok") {
							} else {
								alert('Ошибка изменения описания. Отменено.');
								li.querySelector('.description').innerText = olddesc;
							}
						}
					});
				}
				$(this).dialog('close');
			},
			'Отменить': function() {
				$(this).dialog('close');
			}
		},
		close: function(ev, ui) {
			$(this).dialog('destroy');
			document.body.removeChild(dialog_div);
		}
	});

	//$(dialog).dialog('open');
}

var ch_car = function(){
	var li = this.parentNode.parentNode;
	var imei = li.dataset.imei;
	var skey = li.dataset.skey;
	var desc = li.querySelector('.description').innerText;

	log('ch_car');

	config.helper.exdialog('/html/dialogs/car.html', '/api/sys/car?skey='+skey, {imei:imei, desc:desc}, {
		create: function(event, ui) {
			$(this.querySelector('div.tabs')).tabs();
			var drivers = this.querySelector('ul.drivers');
			log('on dialog open', this, drivers);
			for(var i=0; i<20; i++){
				drivers.insertAdjacentHTML('beforeend', '<li>Водитель '+(i+1)+'<span class="ui-icon ui-icon-close" title="Отвязать водителя от данного транспортного средства."></span></li>');
			}
			$(this.querySelector('button.drvedit')).button().click(function(){
				config.helper.exdialog('/html/dialogs/drivers.html', '/api/misc/drivers?skey='+skey, {imei:imei, desc:desc}, {});
			});
		},
		open: function(){
		},
		buttons: {
			'Водители': function(){
				//alert('В разработке.');
				config.helper.exdialog('/html/dialogs/drivers.html', '/api/misc/drivers?skey='+skey, {imei:imei, desc:desc}, {});
			}
		}
	});

	/*
	config.helper.getJSON('/api/sys/car?cmd=get&skey='+skey, function(data){
		log('/api/sys/car?get', data);
		var info = data.info;
		info.imei = imei;
		info.desc = desc;
		config.helper.dialog('/html/dialogs/car.html', info, {
			'Применить изменения.': function() {
				var form = this.querySelector('form');

				data = {skey:skey};
				config.helper.parseform(form, data);

				config.helper.postJSON('/api/sys/car?cmd=set&skey='+skey, data, function(data){
					log('/api/sys/car', data);
				});

				$(this).dialog('close');
			}
		});
	});*/

}

var bzone = function(){
	var li = this.parentNode.parentNode;
	var imei = li.dataset.imei;
	var skey = li.dataset.skey;
	var desc = li.querySelector('.description').innerText;

	$('#config_zone_link_imei').html(imei);
	//var desc = par.find('desc').html();
	//var desc = [].filter.call(this.parentNode.parentNode.childNodes, function(el){if(el.nodeType==Node.TEXT_NODE) return el;})[0].data;

	$('#config_zone_link_desc').html(desc);

	var dialog = $('#config_zone_link');
	dialog[0].dataset.skey = skey;

	dialog.dialog('open');
}

var bconf = function(){
	var li = this.parentNode.parentNode;
	var imei = li.dataset.imei;
	var skey = li.dataset.skey;
	var desc = li.querySelector('.description').innerText;


	if($('#config_params').length === 0){
		var div = $('body').append(
			'<div id="config_params"><div id="config_params_body">Загрузка данных с сервера...</div></div>'
		);
	} else {
		$('#config_params_body').html('Загрузка данных с сервера...');
	}
	$.getJSON('/api/sys/config?cmd=get&skey='+skey, function (data) {
		if(data.answer == 'ok'){
			if(data.config.length === 0){
				$("#config_params_body").empty().html('Нет параметров. Возможно система еще не сохранила параметры.<br/>Можно послать SMS на номер системы с текстом <strong>saveconfig</strong> для принудительного сохранения параметров.');
			} else {
				//log('Config_GET:', data);
				var rows = '<table class="tview"><thead><tr><th>№</th><th>Имя</th><th>Описание<span id="config_params_show_all" title="Показать все" class="cursor_pointer">...</span></th><th>Значение</th><th>Заводская установка</th><th>Очередь</th></tr></thead><tbody>';
				var index = 1;
				for(var i in data.config){
					var v = data.config[i];
					rows += '<tr name="'+v[0]+'"'+ (v[1].desc?'':' class="config_hide"') +'>';
					rows +=	'<td>'+index+'</td>';
					rows += '<td>'+v[0]+'</td>';
					if(config.admin){
						rows += '<td class="cfg_changeble">' + (v[1].desc || '-') + '</td>';
					} else {
						rows += '<td>' + (v[1].desc || '-') + '</td>';
					}
					rows += '<td class="cfg_changeble'+(v[1].wait?' wait':'')+'">' + v[1].value + '</td>';
					rows += '<td>' + v[1]['default'] + '</td><td>' + ((v[1].wait)?(v[1].wait):'') + '</td></tr>';
					index += 1;
				}
				rows += '</tbody></table>';
				$("#config_params_body").empty().append(rows);
				$('#config_params').dialog('option', 'position', 'center');
				$('#config_params_show_all').click(function(){
					//log('boo');
					$('.config_hide').removeClass('config_hide');
					$('#config_params').dialog('option', 'position', 'center');
				});

				var tb = $('#config_params_body table tbody');
				//log('table = ', tb);
				//log('table>tr>td:first = ', tb.find('tr').find('td:first'));
				tb.find('tr').find('td:first').next().next().click(function(){
					if(config.admin){
						var name = $(this).parent().attr('name');
						var pvalue = $(this).html();
						var nvalue = prompt("Введите описание для '" + name + "'", pvalue);
						if(nvalue && nvalue != pvalue){
							//log('Change description', name);
							$(this).html(nvalue);
							sendGet('/api/param/desc?name=' + name + '&value=' + nvalue);
						}
					}
				}).next().click(function(){
					var name = $(this).parent().attr('name');
					var pvalue = $(this).html();
					var nvalue = prompt("Введите значение для '" + name + "'", pvalue);
					if(nvalue && nvalue != pvalue){
						//log('Change value', name);
						$(this).next().next().html(nvalue);
						$(this).addClass('wait');
						sendGet('/api/sys/config?cmd=set&skey=' + skey + '&name=' + name + '&value=' + nvalue);
					}
				});
			}
		}
	});
	/*$('#config_params_close').button().click(function(){
		$('#config_params, #config_overlay').remove();
	});*/

	$('div#config_params_body').css('max-height', $(window).height() - 200);

	$('#config_params').dialog({
		width: '90%',
		/*height: '60%',*/
		//maxHeight: $(window).height() - 100,
		modal: true,
		autoOpen: true,
		title: desc,
		//position: ['left','top'],
		buttons: {
			'Отменить задание на изменение параметров': function() {
				sendGet('/api/sys/config?cmd=cancel&skey=' + skey);
				$(this).dialog('close');
			},
			'Закрыть': function() {
				$(this).dialog('close');
			}
		}
	});
}

var bpurge = function(){
	var li = this.parentNode.parentNode;
	var imei = li.dataset.imei;
	var skey = li.dataset.skey;
	var desc = li.querySelector('.description').innerText;

	//log('Удаление GPS данных для системы', this, imei);
	if($('#config_purgegps').length === 0){
		$('body').append(
			//'<div id="config_overlay" class="ui-widget-overlay"></div>' +
			'<div id="config_purgegps">' +
			'Удаление GPS данных для системы<br/><strong><label></label></strong><br/><br/>' +
			'<span style="color: red">Внимание!</span> Данные старее выбранной даты будут удалены.' +
			'<input type="text" id="config_purgegps_alternate" disabled=sidabled size="30"/>' +
			'<div id="config_purgegps"></div>' +
			//'<button></button><br/>' +
			'</div>'
		);
		var div = $('#config_purgegps');
		//div.children('label').first().html(imei+':'+$(this).parent().children('desc').html());
		$('#config_purgegps').datepicker({
			altField: "#config_purgegps_alternate",
			altFormat: "dd.mm.yy DD"
		});
		//div.children('button').button().click(function(){
		//});
	}

	//$('#config_purgegps label').first().html(imei+':'+$(this).parent().children('desc').html());
	$('#config_purgegps label').first().html(imei+':'+desc);
	//div.children('strong').children('label').first().html(imei+':'+$(this).parent().children('desc').html());
	$('#config_purgegps').dialog({
		autoOpen: true,
		title: 'Удаление GPS данных',
		modal: true,
		minHeight: 390,
		buttons: {
			'Отмена': function() {
				//sendGet('/api/sys/config?cmd=cancel&imei=' + imei);
				$(this).dialog('close');
			},
			'Выполнить!': function() {
				var dateto = $.datepicker.formatDate('ymmdd000000', $('#config_purgegps').datepicker('getDate'));
				//log('Удаление GPS данных для системы', imei, ' до даты ', dateto);
				$.getJSON('/api/geo/del?skey='+skey+'&to='+dateto, function (data) {
					if(data.answer == 'ok'){
						alert('Удаление данных поставлено в очередь. Это может потребовать некоторого времени.');
					} else {
						alert('Ошибка:\r\n'+data.result);
					}
				});
				$(this).dialog('close');
			}
		}
	});
}

var bico = function() {
	alert('В разработке');
}

var bdel = function() {
	var li = this.parentNode.parentNode;
	var imei = li.dataset.imei;
	var skey = li.dataset.skey;
	var desc = li.querySelector('.description').innerText;

	$('#config_dialog_delsys')[0].dataset.skey = skey;
	$('#config_del_imei').html(imei);
	//$('#config_del_desc').html($(this).parent().find('desc').html());
	$('#config_del_desc').html(desc);

	$('#config_dialog_delsys').dialog('open');
}


var btags = function() {
	//var tag_div = document.createElement(div);
	var skey = this.parentNode.parentNode.dataset.skey;
	var s = config.sysbykey[skey];

	var avail_tags = {};
	for(var k in config.sysbykey) {
		for(var t in config.sysbykey[k].tags) {
			avail_tags[config.sysbykey[k].tags[t]] = 1;
		}
	}
	log('Доступные ярлыки:', avail_tags);

	var tag_dialog = config.helper.element_by_html(''+
	'<div title="Назначение ярлыков.">'+
	'	Система <b>'+config.sysbykey[skey].desc+'</b><br>'+
	'	<br>Назначенные ярлыки:'+
	'	<div id="btag_div_set" class="ui-widget ui-widget-content tview">'+
	'	</div>'+
	'	<br>Доступные ярлыки:'+
	'	<div id="btag_div_avail" class="ui-widget ui-widget-content tview">'+
	'	</div>'+
	'	<br><button id="btag_button_new">Добавить новый ярлык</button>'+
	'<details><summary><span class="pln">?</span></summary><span class="pln">Ярлык должен представлять собой короткое информативное слово или фразу.</span></details>' +
	'</div>'+
	'');
	var tag_set = tag_dialog.querySelector('#btag_div_set');
	var tag_avail = tag_dialog.querySelector('#btag_div_avail');
	for(var k in s.tags){
		tag_set.appendChild(span(s.tags[k], 'Нажмите чтобы отвязать данный ярлык от системы'));
	}

	for(var k in avail_tags){
		if(s.tags.indexOf(k)==-1) tag_avail.appendChild(span(k, 'Нажмите чтобы прикрепить данный ярлык к системе'));
	}
	tag_set.addEventListener('click', function(ev) {
		if(ev.target.nodeName == 'SPAN'){
			//log('tag_set:click', this, ev);
			//this.removeChild(ev.target);
			tag_avail.appendChild(ev.target);
			var index = s.tags.indexOf(ev.target.innerText);
			s.tags.splice(index, 1);
		}
	});
	tag_avail.addEventListener('click', function(ev) {
		//log('tag_avail:click', this, ev);
		if(ev.target.nodeName == 'SPAN'){
			tag_set.appendChild(ev.target);
			s.tags.push(ev.target.innerText);
		}
	});
	//$(tag_dialog).find('button').button();
	//log('tag_dialog', tag_dialog);
	$(tag_dialog).dialog({
		//width: 140,
		height: 300,
		modal: true,
		open: function(ev, ui) {
			//log('tag_dialog:open', tag_dialog);
			$('#btag_button_new').button().click(function(){
				var nvalue = prompt('Введите название ярлыка');
				tag_set.appendChild(span(nvalue, 'Нажмите чтобы отвязать данный ярлык от системы'));
				s.tags.push(nvalue);
				log('sys:', s);
			});
		},
		close: function(ev, ui) {
			log('tag_dialog:close:', s.tags);
			config.helper.postJSON('/api/sys/tags', {skey: skey, tags: s.tags}, function(data){
				log('/api/sys/tags call successful', data);
			});

			$(this).dialog('destroy');
			document.body.removeChild(tag_dialog);
		},
		buttons: {
			'Закрыть': function() {
				$(this).dialog('close');
			}
		} 
	})
	
}

config.updater.tabs[4] = function(){
	log('Tab Config activated.');
	$("#config_list").accordion("resize");
	if(!ConfigList){
		var ctl_div = document.createElement('span');
		ctl_div.innerHTML = ''+
			'<button class="key bdesc mm" title="Изменить описание">...</button>' +
			'<button class="key btags mm" title="Назначить ярлыки">Ярлыки</button>' +
			'<button class="key bcar mm" title="Информация об объекте">Инф.</button>' +
			'<!--button class="bico hl mm" title="Выбрать пиктограмму">Икон.</button-->' +
			'<button class="bconf hl mm" title="Настроить систему">Конф.</button>' +
			'<button class="key bzone mm" title="Привязать ГЕО-зону">Зоны</button>' +
			(config.admin?'<button class="key calarm mm" title ="Принудительная отмена тревоги">ОтмТрев</button>':'') +
			(config.admin?'<button class="bpurge hl mm" title="Удалить GPS данные!">Удал.GPS</button>':'') +
			'<button class="key bdel mm" title="Отказаться от слежения за системой">Удалить</button>'+
		'';
		//$(ctl_div).find('button').button();

		$(ctl_div).find('.bdesc').button().click(ch_desc);
		$(ctl_div).find('.bcar').button().click(ch_car);
		if(config.admin) $(ctl_div).find('.calarm').button().click(cancel_alarm);
		$(ctl_div).find(".bzone").button().click(bzone);
		$(ctl_div).find(".btags").button().click(btags);
		$(ctl_div).find('.bconf').button().click(bconf);
		if(config.admin) $(ctl_div).find('.bpurge').button().css('color', 'red').click(bpurge);
		$(ctl_div).find('.bico').button().click(bico);
		$(ctl_div).find('.bdel').button().click(bdel);

		ConfigList = new SysList('config_sys_list', {
			element: function(s){
				var li = document.createElement('li');
				li.className = 'ui-widget ui-widget-content ui-widget-header';
				//li.style.width = '200px';
				//li.className = 'ui-widget ui-widget-content';
				li.innerHTML = '<span class="ui-icon ui-icon-arrowthick-2-n-s mm msp"></span>' +
					'<span class="spanbrd" title="IMEI">' + s.imei.replace(/-.*/,'') + '</span><span class="spanbrd" title="Телефон">' + (s.phone!='None'?(s.phone):'не определен') + '</span>' +
					'<span class="description" contenteditable>' + s.desc + '</span>' +
					'';
				var tag_block = document.createElement('span');
				tag_block.className = "tag_block";
				li.appendChild(tag_block);
				for(var k in s.tags){
					tag_block.appendChild(span(s.tags[k], ''));
				}

				li.addEventListener('mouseover', function(){
					//log('config_list:mouseover', this);
					this.appendChild(ctl_div);
					tag_block.style.display = 'none';
					return false;
				}, false);
				li.addEventListener('mouseout', function(ev){
					//log('config_list:mouseout', this);
					if((ev.target != ctl_div) && (ev.toElement != ctl_div) && (ev.target.parentNode != ctl_div) && (ev.toElement.parentNode != ctl_div) && (ev.target.parentNode.parentNode != ctl_div) && (ev.toElement.parentNode.parentNode != ctl_div)) {
						this.removeChild(ctl_div);
						//log('config_list:mouseout', this, ev);
					}
					tag_block.style.display = '';
					return false;
				}, false);
				li.querySelector('span.description').addEventListener('keypress', function(ev){
					//log(ev.charCode);
					if(ev.charCode == 13) {
						this.blur();
						return ev.preventDefault();
					}
				}, false);
				li.querySelector('span.description').addEventListener('focus', function(ev){
					var olddesc = this.innerText;
					var skey = this.parentNode.dataset.skey;
					//log('focus', ev, this);
					//if(ev.charCode == 13) return ev.preventDefault();
					//this.style.textOverflow = '';
					//this.style.width = '';
					var keyup = function(ev){
						//log(ev.charCode);
						if(ev.keyCode == 27){
							this.innerHTML = olddesc;
							//this.removeEventListener('keyup', keyup, false);
							//this.removeEventListener('blur', blur, false);
							/*var evt = document.createEvent("Event");
							evt.initEvent('blur', true, true);
							document.dispatchEvent(evt);*/
							this.blur();
						}
					};
					var blur = function(ev){
						var desc = this.innerText;
						var me = this;
						//this.style.textOverflow = 'ellipsis';
						//this.style.width = '200px';
						if(desc != olddesc) {
							log('change desc', skey, desc);
							$.getJSON('/api/sys/desc?skey=' + skey + '&desc=' + encodeURIComponent(desc), function (data) {
								if(data.result){
									var result = data.result;
									if(result == "disabled"){
										alert('Изменение описание заблокировано.');
										me.innerText = olddesc;
									} else if(result == "ok") {
									} else {
										alert('Ошибка изменения описания. Отменено.');
										me.innerText = olddesc;
									}
								}
							});
						}
						this.removeEventListener('keyup', keyup, false);
						this.removeEventListener('blur', blur, false);
					};
					this.addEventListener('blur', blur, false);
					this.addEventListener('keyup', keyup, false);
				}, false);
				return li;
			}
		});
		config.updater.add('change_tag', function(msg) {
			var li = ConfigList.element.querySelector('li[data-skey="'+msg.skey+'"]>span.tag_block');
			if(li) {
				li.innerHTML = '';	// Не знаю на сколько красивая такая очистка.
				for(var t in msg.data.tags) {
					li.appendChild(span(msg.data.tags[t], ''));
					//log('tag', t, msg.data.tags[t]);
				}
			}
			//log('ConfigList:change_tag', msg, li);
		});


	if(window.config.account.user.admin) $('.admin').show();
		// Закладка "Наблюдаемые системы"

	$("#config_button_sys_add").click(function(){ $("#config_dialog_addsys").dialog('open'); });
		var do_add_sys = function(imei, cb) {
			log('imei', imei);
			//var imei = $('#config_dialog_addsys #config_addsys_imei').val();
			//var file = 
			$.getJSON('/api/sys/add?imei=' + imei, function (data) {
				//window.location = "/config";
				//$(this).dialog('close');
				if(data.result){
					var result = data.result;
					if(result == "not found"){
						if(cb && cb.notfound) cb.notfound(imei);
					} else if(result == "already"){
						if(cb && cb.already) cb.already(imei);
					} else if(result == "added") {
						log('manual add', data.system);
						ConfigList.handlers.additem.call(ConfigList, data.system);
						if(cb && cb.add) cb.add(imei);
					}
				}
			});
		}

		$("#config_dialog_addsys").dialog({
			width: 400,
			height: 200,
			modal: true,
			autoOpen: false,
			open: function(){
				var form = document.getElementById('config_dialog_addsys').querySelector('form');
				log('form', form, form.imei, form.file);
				form.file.value='';
			},
			buttons: {
				'Добавить систему.': function() {
					var form = document.getElementById('config_dialog_addsys').querySelector('form');
					var file = form.file.files[0];

					if(form.file.files.length > 0) {
						/* Добавление через список файлов */
						var reader = new FileReader();
						reader.onload = function(e) {
							var list = e.target.result.replace(/[\r\t\n]/g, ' ').replace(/  /g, ' ').split(' ').filter(function(el){return (el!='') && (el!=' ')});

							//log('read', e, e.target.result, list);
							var dialog = ['<div title="Список добавляемых систем"><ul>'];
							list.forEach(function(el){dialog.push('<li data-imei="'+el+'">'+el+'<span class="ui-icon ui-icon-close" title="Удалить" style="cursor: pointer;"></span></li>');});
							dialog.push('</ul></div>');
							dialog = config.helper.element_by_html(dialog.join(''));
							$(dialog).dialog({
								modal: true,
								width: 500,
								height: 300,
								create: function(){
									$(this).find('span').click(function(ev){
										log('this', this.parentNode.innerText);
										var index = list.indexOf(this.parentNode.innerText);
										if(index >= 0) {
											list.splice(index, 1);
											this.parentNode.parentNode.removeChild(this.parentNode);
										}
									});
								},
								buttons: {
									'Да, все верно, добавить.': function(ev, ui){
										log('confirm', list);
										var btn = ev.currentTarget;
										$(btn).button( 'option', {
											icons: {primary:'ui-icon-gear'},
											label: 'Обработка...',
											disabled: true
										});
										[].forEach.call(list, function(imei){
											var li = dialog.querySelector('li[data-imei="'+imei+'"]');
											li.removeChild(li.lastChild);
											var res = document.createElement('span');
											res.style.color = 'black';
											res.innerText = ' обработка...';
											li.appendChild(res);
											do_add_sys(imei, {
												add: function(imei){
													log('added', imei);
													//li.lastChild.insertAdjacentHTML('beforebegin', 'added');
													res.style.color = 'green';
													res.innerText = ' выполнено';
												},
												notfound: function(imei){
													log('not found', imei);
													//li.lastChild.insertAdjacentHTML('beforebegin', 'not found');
													res.innerText = ' система не найдена';
													res.style.color = 'red';
												},
												already: function(imei){
													log('already', imei);
													//li.lastChild.insertAdjacentHTML('beforebegin', 'already');
													res.innerText = ' вы уже наблюдаете за этой системой';
													res.style.color = 'blue';
												}
											});
										});
									}
								}
							});
							//window['a'] = e.target.result;
							//document.getElementById('config_dialog_addsys').textContent = e.target.result;
						};
						reader.readAsBinaryString(file);
						// Read in the image file as a data URL.
						//reader.readAsDataURL(file);

					} else {
						/* Добавление через IMEI */
						var imei = form.imei.value;
						do_add_sys(imei, {
							add: function(imei){
								log('added', imei);
							},
							notfound: function(imei){
								log('not found', imei);
								$("#dialog_addsys_not_found").dialog('open');
							},
							already: function(imei){
								log('already', imei);
								$("#dialog_addsys_already").dialog('open');
							}
						});
					}

					$(this).dialog('close');
				},
				'Отменить': function() {
					$(this).dialog('close');
				}
			}
		});


		var add_zone_rule = function(){
			var tbody = $('#config_zone_link table tbody');
			var select_zone = 
				'<select name="config_select_zone_list" style="width:100%;" title="Выберите зону" onchange="/*UpdateGroupList();*/">'+
				'	<option value="zz0">Зона 1</option>'+
				'	<option value="zz1">Зона 2</option>'+
				'	<option value="zz2">Зона 3</option>'+
				'</select>';
			var select_event =
				'<select name="config_select_event_list" style="width:100%;" title="Группа" onchange="/*UpdateGroupList();*/">'+
				'	<option value="0" title="Cообщение будет отражено в отчетах и в событиях">"Тихое" оповещение при покидании зоны</option>'+
				'	<option value="1" title="Cообщение будет выведено на экран всем пользователям, наблюдающим за системой">"Cрочное" оповещение при покидании зоны</option>'+
				'	<option value="2">"Тихое" оповещение о вхождении в зону</option>'+
				'	<option value="3">"Срочное" оповещение о вхождении в зону</option>'+
				'	<option value="4">Начало трека при покидании зоны</option>'+
				'	<option value="5">Конец трека при вхождении в зону</option>'+
				'	<option value="6">Событие 6</option>'+
				'	<option value="7">Событие 7</option>'+
				'	<option value="8">Событие 8</option>'+
				'	<option value="9">Событие 9</option>'+
				'	<option value="10">Событие 10</option>'+
				'</select>';

			tbody.append('<tr><td>'+select_zone+'</td><td>'+select_event+'</td><td>00:00:00</td><td>23:59:59</td><td>норма</td><td><button class="key">.</button></td></tr>');
			$('#config_zone_link table tbody tr:last td:last button').button({text: false, icons: {primary: "ui-icon-close"}}).click(function(){
				//log('delete zone rule', this, $(this).parent().parent());
				$(this).parent().parent().remove();
			});
		}

		window['config_delete_zone_rule'] = function(){
		}

		$('#config_zone_link_add_rule').click(function(){
			//log('add zone rule');
			add_zone_rule();
		});

		$("#config_zone_link").dialog({
			width: 800,
			height: 650,
			modal: true,
			autoOpen: false,
			open: function(event, ui){

				//log('Zone Config dialog open');
				
				//for(var i=0; i<10; i++){
				//	add_zone_rule();
				//}
				$(this).dialog('option', 'position', 'center');
			},
			buttons: {
				/*
				'За.': function() {
					var dialog = $(this);
					//log(dialog);
					//log($(this));
					//$("#sysdesc_imei").html(sys_imeis[i])
					var imei = dialog.find('label').html();
					//$("#sys_desc").val(sys_descs[i]);
					var desc = dialog.find('textarea').val();

					//var imei = $("#sysdesc_imei").html(); //document.getElementById('sysdesc_imei').value;
					//var desc = document.getElementById('sys_desc').value;
					log('Set desc for sys ' + imei + ' -> ' + desc);
					$.getJSON('/api/sys/desc?imei=' + imei + '&desc=' + desc, function (data) {
						if(data.result){
							var result = data.result;
							if(result == "disabled"){
								//$("#dialog-need-admin").dialog('open');
							} else if(result == "ok") {
								//UpdateSysList();
								//$("#config_sysdsc_"+imei).html(desc);
								$("#config_sys_list").find('li[imei="'+imei+'"]>desc').html(desc);
							}
						}
					});
					$(this).dialog('close');
				},*/
				'Закрыть': function() {
					$(this).dialog('close');
				}
			}
		});

		$("#dialog_addsys_not_found").dialog({modal: true, autoOpen: false, buttons:{Ok: function(){$(this).dialog("close");}}});
		$("#dialog_addsys_already").dialog({modal: true, autoOpen: false, buttons:{Ok: function(){$(this).dialog("close");}}});

		$("#popup-sys").dialog({modal: true, autoOpen: false});
		$("#popup-sys li").button();

		$('#config_dialog_delsys').dialog({
			modal: true,
			autoOpen: false,
			buttons:{
				'Нет': function(){
					$(this).dialog("close");
				},
				'Да, отказаться от слежения': function(){
					var imei = $('#config_del_imei').html();
					var skey = this.dataset.skey;

					$.getJSON('/api/sys/del?skey=' + skey, function (data) {
						//ConfigList.Rebuild();	// Это неправильная реализация.
					});
					var ul = ConfigList.element;
					var li = ConfigList.element.querySelector('li[data-skey='+skey+']');
					if(ul && li){
						ul.removeChild(li);
					}
					//log('del:', skey, li, ul);
					$(this).dialog("close");
				}
			}
		});

		$("#config_list").accordion({
			fillSpace: true,
			collapsible: true,
			change: function(event, ui) {
				//var active = ui.options.active;	// Аналогичное действие, но может в будуещем стать неработоспособным
				var active = $(this).accordion('option', 'active');
				log('accordion change', event, ui, this, active);
			}
		});
		$("#config_sys_list").sortable({
			//delay: 500,
			//axis: 'y',
			//containment: 'parent',
			handle: '.msp',
			revert: true,
			scrollSpeed: 5,
			stop: function(event, ui){
				/*console.log(ui.item.index());
				console.log(ui.item.attr('imei'));
				console.log(ui);*/
				//var imei = ui.item.attr('imei');
				var skey = ui.item[0].dataset.skey;
				var index = ui.item.index();
				$.getJSON('/api/sys/sort?skey=' + skey + '&index=' + index, function (data) {
					//window.location = "/config";
					//$(this).dialog('close');
					if(data.result){
						log('Set new position for ' + skey + ' to ' + index);
					}
				});

			}
		});
		//$("#config_sys_list").disableSelection();

		// Выбор темы оформления

		$('#config_list select#config_set_theme option[value="'+config.ui.theme+'"]').attr('selected', 'selected');
		//log('Set theme item:', config.ui.theme, $('#config_list select#config_set_theme option[value="'+config.ui.theme+'"]'));

		$('#config_list #config_set_theme').bind('change', function(){
			var themename = $(this).attr('value');
			//log(themename);
			saveconfig('theme', themename);

			//var hl = $('head #themecss');
			//hl.attr('href', '/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/'+themename+'/jquery-ui.css');
			config.account.config.theme = themename;
			window.config.setTheme(config.account.config.theme);

			//log(hl);
		});


		// Цвет трека
		config.ui.trackcolor = config.ui.trackcolor || '#dc00dc';
		$('#colorpickerHolder div').css('backgroundColor', config.ui.trackcolor);
		$('#colorpickerHolder').ColorPicker({
			color: config.ui.trackcolor,
			//color: '#ff0000',
			onShow: function (colpkr) {
				$(colpkr).fadeIn(100);
				//log('show');
				return false;
			},
			onHide: function (colpkr) {
				$(colpkr).fadeOut(100);
				//log('hide');
				saveconfig('trackcolor', null);
				return false;
			},
			onChange: function (hsb, hex, rgb) {
				config.ui.trackcolor = '#' + hex;
				$('#colorpickerHolder div').css('backgroundColor', config.ui.trackcolor);
				//log('change');
			}
		});



		// Перезапуск
		$('#button_config_restart').click(function(){
			window.location.href = window.location.href;
		});

		// Административные и отладочные функции

		if(config.admin){
			$("button.dbg_send_msg").click(function(){
				var imei = $(this).attr('imei');
				var text = $(this).attr('value');
				//sendGet('http://localhost/addlog?imei='+imei+'&text=%D0%92%D0%BD%D0%B5%D1%88%D0%BD%D0%B5%D0%B5+%D0%BF%D0%B8%D1%82%D0%B0%D0%BD%D0%B8%D0%B5:+%3Cb%3E%D0%BD%D0%BE%D1%80%D0%BC%D0%B0%3C/b%3E');
				sendGet('/addlog?imei='+imei+'&text='+text);
			});
			$("button.dbg_send_cfg").click(function(){
				var imei = $(this).attr('imei');
				var text = '';
				for(var i=0; i<100; i++){
					text += 'dbg.name.'+i+' INT '+i*10+' 10\n';
				}
				//sendGet('http://localhost/addlog?imei='+imei+'&text=%D0%92%D0%BD%D0%B5%D1%88%D0%BD%D0%B5%D0%B5+%D0%BF%D0%B8%D1%82%D0%B0%D0%BD%D0%B8%D0%B5:+%3Cb%3E%D0%BD%D0%BE%D1%80%D0%BC%D0%B0%3C/b%3E');
				sendPost('/config?cmd=save&imei='+imei, text);
			});
			
		}

		$('.cfg_iframe').click(function(){
			//log('boo', this);
			if($(this).find('div').length == 0){
				$(this).append('<div><iframe src="'+$(this).attr('value')+'" style="width:100%; height: 70%;">'+
				'Ваш браузер не поддерживает iframe. Сожалеем, но единственным выходом является использование другого браузера. Мы рекомендуем <a href="http://www.google.com/chrome?hl=ru">Google Chrome.</a>'+
				'</iframe></div>');
			} else {
				$(this).find('div').remove();
			}
			/*
			if($('#config_binbackup').length === 0){
				$('#dbg_binbackup').after(
				'<div id="config_binbackup" style="width: 100%; height: 300px; border: 1px solid black;"><iframe src="/binbackup" style="width: 100%; height: 100%; display: block;">'+
				'	Ваш браузер не поддерживает iframe. Сожалеем, но единственным выходом является использование другого браузера. Мы рекомендуем Google Chrome.'+
				'</iframe></div>'
				);
			} else {
				$('#config_binbackup').remove();
			}
			*/
		});


		// Главный аккордион
		// Нужно добавить проверку что вкладка активна иначе вызвать при активации закладки
		$(window).resize(function(){
			if(config.tab == 4) $("#config_list").accordion("resize");
		});
		setTimeout(function(){$("#config_list").accordion("resize")}, 1000);


		var show_admin_opetaions = function(cursor){
			var url;
			if(cursor){
				url = '/api/admin/operations?cursor=' + cursor;
			} else {
				url = '/api/admin/operations';
			}
			$.getJSON(url, function (data) {
				if(data.answer && data.answer=='ok'){
					log('Admin operations', data);
					var table = $("#table_admin_operations tbody");
					table.empty();

					for(var i in data.operations){
						var d = data.operations[i];
						var row = '<tr><td>' + dt_to_datetime(d.time) + '</td><td>' + d.desc + '</td><td>' + d.account + '</td><td>' + JSON.stringify(d.params) + '</td></tr>';
						table.append(row);
					}
					var row = '<tr><td colspan=5><button id="button_next_admin_operations">Показать более старые записи</button></td></tr>';
					table.append(row);
				}
				var cursor = data.cursor;
				$('#button_next_admin_operations').button().click(function(){
					show_admin_opetaions(cursor);
				});
			});
		}

		$('#button_admin_operations').click(function(){
			show_admin_opetaions();
		});
	}
}

})(this, jQuery);
