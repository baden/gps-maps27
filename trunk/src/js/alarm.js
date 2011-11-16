"use strict";
(function( $, undefined ) {



var alertcnt = 0;
var geocoder;
if('google' in window) geocoder = new google.maps.Geocoder();
//var sound;

window.config['informer'] = {};
config.updater.add('inform', function(msg) {
	log('Inform: update', msg);

	if(msg.data.skey in window.config.informer){
		var infs = window.config.informer[msg.data.skey];
		for(var i in infs){
			if(infs[i].msg == msg.data.msg){
				infs[i].callback();
				delete infs[i];		// Не совсем правильное удаление, оно не удаляет, а ставит undefined
			}
		}
	}
});

var push_informer = function(skey, msg, callback){
	if(!(skey in window.config.informer)) window.config.informer[skey] = [];
	window.config.informer[skey].push({
		'msg': msg,
		'callback': callback
	});
}

window.config['alarm'] = {};

var remove_alert_icon = function(skey){
	$('div#alert_container>span[skey="'+skey+'"]').remove();
}


var show_alarm_window = function(skey, update){
	var data = window.config.alarm[skey];

	if(update){
		var sound = new Audio();
		sound.src = 'sound/alarm.' + (sound.canPlayType('audio/ogg') ? 'ogg' : sound.canPlayType('audio/mp3') ? 'mp3' : 'wav');
		sound.play();
	}
	//console.dir(sound);

	if(update){
		data.dthistory = data.dthistory || [];
		data.dthistory.push(data.dt);
	}

	data.position = new google.maps.LatLng(data.lpos[0], data.lpos[1]);

	if($('#alarmdlg_' + skey).length > 0){
		if($(data.dialog).dialog('isOpen')){
			if(update) $(data.dialog).parent().children().first().children().first().effect('pulsate');
		} else $(data.dialog).dialog('open');
		data.map.panTo(data.position);
		data.marker.setPosition(data.position);
		
	} else {
		var messageBox = document.createElement('div');
		messageBox.id = 'alarmdlg_' + skey;
		messageBox.className = 'alertmsg';
		messageBox.innerHTML = 'Система: <b>' + window.config.sysbykey[skey].desc + '</b>'+
			'<br/>Идентификатор: <b>' + data.fid + '</b>';

		if (document.body.firstChild) document.body.insertBefore(messageBox, document.body.firstChild);
		else document.body.appendChild(messageBox);

		data.datetime = document.createElement('div');
		messageBox.appendChild(data.datetime);

		data.addres = document.createElement('div');
		messageBox.appendChild(data.addres);
		var dmap = document.createElement('div');
		dmap.id = 'alarmmap_' + String(new Date().getTime());
		dmap.className = 'alertmap';
		messageBox.appendChild(dmap);
		var $map = $(dmap).gmap({
			pos: data.position,
			zoom: 15,
			marker: 'center',
		});
		data.map = $($map).gmap('option', 'map');
		data.marker = new google.maps.Marker({
			position: data.position,
			map: data.map,
			title: 'Последнее известное положение.',
			icon: $.gmap.images['alarm'],
	       		draggable: false
		});

        	alertcnt++;

		window.config.alarm[skey].dialog = $(messageBox).dialog({
			title: '<span class="ui-icon ui-icon-alert" style="display:inline-block;"></span> <span style="color:red;">Внимание! Нажата тревожная кнопка.</span>',
			//hide: 'slide',
			//show: 'drop',
			//stack: false,
			resizable: false,
			modal: false,
			autoOpen: true,
			width: 630,
			height: 420,
			buttons:[{
				text: 'Подтверждение',
				click: function(event, ui){
					var btn = event.currentTarget;
					var cncl_btn = event.currentTarget.nextSibling;

					var dialog = this;
					log($(dialog).dialog('option', 'buttons'));
					console.dir($(dialog).dialog('option', 'buttons'));

					$(btn).button( 'option', {
						icons: {primary:'ui-icon-gear'},
						label: 'Отправка подтверждения...',
						disabled: true
					});
					$.getJSON('/api/alarm/confirm?akey='+window.config.akey+'&imei=' + config.sysbykey[skey].imei, function (data) {
						if (data.answer && data.answer === 'ok'){
							$(btn).button( 'option', {
								icons: {primary:'ui-icon-zoomin'},
								label: 'Ожидание ответа...',
								disabled: true
							});
							// Так мудрёно сделано, пипец
							// Я сильно удивлюсь если тут не будет утечки памяти
							push_informer(skey, 'ALARM_CONFIRM', function(){
								log('Inform: wait-callback done.');
								$(btn).button( 'option', {
									icons: {primary:'ui-icon-flag'},
									label: 'Подтверждено!',
									disabled: true
								});
								window.config.alarm[skey].confirmed = true;
								window.config.alarm[skey].confirmby = window.config.username;
								window.config.alarm[skey].confirmwhen = Date_to_url(new Date());
								$(cncl_btn).button('option',{disabled: false});
								add_alert_icon(skey);
								//$(dialog).dialog('option', 'buttons')['Отмена тревоги'];
							});
						}
					});
				}},{
				text: 'Отбой тревоги',
				click: function(event, ui){
					var btn = event.currentTarget;
					var conf_btn = event.currentTarget.previousSibling;

					var dialog = this;
					$(btn).button( 'option', {
						icons: {primary:'ui-icon-gear'},
						label: 'Отправка отмены...',
						disabled: true
					});
					$.getJSON('/api/alarm/cancel?akey='+window.config.akey+'&imei=' + window.config.sysbykey[skey].imei, function (data) {
						if (data.answer && data.answer === 'ok'){
							$(btn).button( 'option', {
								icons: {primary:'ui-icon-zoomin'},
								label: 'Ожидание ответа...',
								disabled: true
							});
							// Так мудрёно сделано, пипец
							// Я сильно удивлюсь если тут не будет утечки памяти
							push_informer(skey, 'ALARM_CANCEL', function(){
								log('Inform: wait-callback done.');
								$(btn).button( 'option', {
									icons: {primary:'ui-icon-flag'},
									label: 'Тревога отменена!',
									disabled: true
								});
								$(conf_btn).button('option',{disabled: true});
								remove_alert_icon(skey);
								delete window.config.alarm[skey];
								$(dialog).dialog('destroy');
								$('#alarmdlg_' + skey).remove();
							});
						}
					});
				}},{
				text: 'Центровать на большой карте',
				click: function(){
					$(this).dialog("close");

					//var handler = function() {
					//	log('The quick brown fox jumps over the lazy dog.');
					//};

					if($('#tabs').tabs( "option", "selected" ) != 0){
						$('#tabs').bind('tabsshow', function(event, ui) {
							log('binded tab show');
							config.map.panTo(data.position);
							config.map.setZoom(15);
							$('#tabs').unbind(event);
						});
						$('#tabs').tabs('select', 0);		// TBD! Если карта не открывалась еще то нужна задержка.
					} else {
						config.map.panTo(data.position);
						config.map.setZoom(15);
					}
				}}/*,
				'Закрыть': function(){
					$(this).dialog("close");
				}*/
			],
			open: function(event, ui) {
				var btns = $(this).parent().find('button');
				if(window.config.alarm[skey].confirmed){
					log('find key:', this, $(this)[0], $(this).parent().find('button'));
					$(btns[0]).button( 'option', {disabled: true});
					$(btns[1]).button( 'option', {disabled: false});
				} else {
					$(btns[1]).button( 'option', {disabled: true});
				}
				var position = $(this).dialog( "option", "position" );
				position.offset = '' + (alertcnt * 16) + ' ' + (alertcnt * 16);
				$(this).dialog( "option", "position", position );
				$(this).parent().css('border', '3px solid red');
				$(this).parent().children().first().children().first().effect('pulsate');
			},
			close: function(event, ui) {
				alertcnt--;
				if(alertcnt<0) alertcnt = 0;
			}
		});
	}

	var sp = '';
	var title='Тревога в:';
	if(data.dthistory.length > 0){
		//log(data.dthistory);
		for(var i in data.dthistory){
			title+='\r\n' + dt_to_datetime(data.dthistory[i]);
			sp += '+';
		}
		//data.datetime.title = title;
	}
	data.datetime.innerHTML = 'Время: <b>' + dt_to_datetime(data.dt) + '</b><span style="cursor: pointer;" title="'+title+'">'+sp+'</span>';

	if((data.position.lat()==0) && (data.position.lng()==0)){

		data.addres.innerHTML = 'Положение объекта неизвестно. Отсутствует сигнал GPS.  '+
		/*'<span style="display:inline-block;border:1px solid black;cursor:pointer;" spid="1" title="Показать последнее положение из базы.">LAST</span>'+*/
		'<span style="display:inline-block;border:1px solid black;cursor:pointer;border-radius:4px;" spid="2" title="Определить по вышкам сотовой связи (приблизительно)">GSM</span>';
		$(data.addres).find('span[spid="1"]').click(function(){
			log('Show last');
		});
		$(data.addres).find('span[spid="2"]').click(function(){
			log('Show GPRS', data.ceng);
			$.getJSON('/api/gmap/ceng?akey='+window.config.akey+'&ceng=' + data.ceng, function (rdata) {
				if (rdata.answer && rdata.answer === 'ok'){
					data.position = new google.maps.LatLng(rdata.loc[0], rdata.loc[1]);
					data.addres.innerHTML = 'Положение объекта по вышкам GSM: ' + rdata.loc;
					//data.addres.title = rdata.geo;
					data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно

					if(geocoder) geocoder.geocode({'latLng': data.position}, function(results, status) {
	      					if (status == google.maps.GeocoderStatus.OK) {
							var address = geocode_to_addr(results);
	  						//console.log(results);

							data.addres.innerHTML = 'Адрес: <b>' + address + '</b>';
							data.addres.title = 'Нажмите чтобы центровать на миникарте.';
							data.addres.style.cursor = 'pointer';
							$(data.addres).bind('click', function(event){
								data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно
								//log('click');
							});
							//data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно

					      } else {
						        //alert("Geocoder failed due to: " + status);
					      }
					});
				}



			});

		});
	} else if(geocoder) geocoder.geocode({'latLng': data.position}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
		var address = geocode_to_addr(results);

	  	//console.log(results);

		data.addres.innerHTML = 'Адрес: <b>' + address + '</b>';
		data.addres.title = 'Нажмите чтобы центровать на миникарте.';
		data.addres.style.cursor = 'pointer';
		$(data.addres).bind('click', function(event){
			data.map.panTo(data.position);	// Не уверен что замыкание будет работать правильно
			//log('click');
		});
	      } else {
	        //alert("Geocoder failed due to: " + status);
	      }
	});

}

var add_alert_icon = function(skey){
	//log('map:', window.config.map);

// Добавить проверку на то что карта создана (открыта страница карты)
	var ttle = 'Тревога ' + dt_to_datetime(window.config.alarm[skey].dt);
	if(window.config.alarm[skey].confirmed){
		ttle += '\r\nТревога подтверждена оператором ' + window.config.alarm[skey].confirmby;
	}

	if($('div#alert_container>span[skey="'+skey+'"]').length > 0){
		$('div#alert_container>span[skey="'+skey+'"]').remove();
		//return;
	}
	$('div#alert_container').append('<span skey="'+skey+'" title="'+ttle+'">!</span>');

	$('div#alert_container>span[skey="'+skey+'"]').click(function(){
		//log('click minimized alert. TBD show alert window.');
		show_alarm_window(skey, false);
	}).mouseenter(function(ev){
		//log('enter to ', skey, ev);
//		$(map).append('<div id="alarm_popup" style="position: absolute; left: '+ev.clientX+'px; top: '+(ev.clientY-140)+'px; width: 100px; height: 100px; border: 2px solid black; z-index:1002;">Бла бла бла: </div>');
		var msg = 'Система:<b>'+window.config.sysbykey[skey].desc+'</b><br/>' +
			'Время:<b>'+dt_to_datetime(window.config.alarm[skey].dt)+'</b><br/>';

		if(window.config.alarm[skey].confirmed){
			msg+='Тревога подтверждена оператором:<b>'+window.config.alarm[skey].confirmby+'</b><br />'+dt_to_datetime(window.config.alarm[skey].confirmwhen)+'<br/>';
		}

		$(map).append('<div id="alarm_popup">' + msg + '</div>');
	}).mouseleave(function(){
		//log('leave to ', skey);
		$('#alarm_popup').remove();
	}).mousemove(function(ev){
		//log('move to ', skey);
//		$('#alarm_popup').css({left: ev.clientX + 'px', top: (ev.clientY-140) + 'px'});
		$('#alarm_popup').css('left', (ev.clientX-$('#alarm_popup').width()/2) + 'px');
	});
}

var show_alert_icons = function(){
// TBD добавить фильтр по аккаунту.
	$.getJSON('/api/alarm/get?akey=' + window.config.akey, function (data) {
		if (data.answer && data.answer === 'ok'){
			log('alarms:', data);
			for(var i in data.alarms){
				var d = data.alarms[i];

				window.config.alarm[d.skey] = window.config.alarm[d.skey] || {};
				$.extend(window.config.alarm[d.skey], d);
				/*
				window.config.alarm[d.skey].lat = d.lpos[0];
				window.config.alarm[d.skey].lon = d.lpos[1];
				window.config.alarm[d.skey].fid = d.fid;
				window.config.alarm[d.skey].dt = d.dt;
				window.config.alarm[d.skey].dthistory = [];
				for(var j in d.dthistory)
					window.config.alarm[d.skey].dthistory.push(d.dthistory[j]);
				window.config.alarm[d.skey].confirmed = d.confirmed;
				window.config.alarm[d.skey].confirmby = d.confirmby;*/
				add_alert_icon(d.skey);
			}
		}
	});
}

window.config.alarm.show_alert_icons = show_alert_icons;

/*
$(document).ready(function() {
	show_alert_icons();
});
*/

config.updater.add('addlog', function(msg) {

	log('BASE: Alert message', msg);
	//UpdateAccountSystemList();
	if(msg.data['mtype'] != 'alarm') return;

	window.config.alarm[msg.data.skey] = window.config.alarm[msg.data.skey] || {};
	$.extend(window.config.alarm[msg.data.skey], msg.data.data);

	window.config.alarm[msg.data.skey].lpos = [msg.data.data.lat, msg.data.data.lon];
/*
	window.config.alarm[msg.data.skey] = window.config.alarm[msg.data.skey] || {};
	window.config.alarm[msg.data.skey].lat = msg.data.data.lat;
	window.config.alarm[msg.data.skey].lon = msg.data.data.lon;
	window.config.alarm[msg.data.skey].fid = msg.data.data.fid;
	window.config.alarm[msg.data.skey].dt = msg.data.data.dt;

	window.config.alarm[msg.data.skey].dthistory = window.config.alarm[msg.data.skey].dthistory || [];
	window.config.alarm[msg.data.skey].dthistory.push(msg.data.data.dt);
*/

/*
	window.config.alarm[msg.data.skey] = {
		'lat': msg.data.data.lat,
		'lon': msg.data.data.lon,
		'fid': msg.data.data.fid,
		'dt': msg.data.data.dt
	};
*/
	add_alert_icon(msg.data.skey);
	show_alarm_window(msg.data.skey, true);

});


})(jQuery);

