"use strict";

// Private
(function($){
	var log_line = function(d) {
		var row = '<td>'+dt_to_datetime(d.time)+'</td><td>'+d.text+'<!--td>'+d.label+'</td-->';
		if(config.admin){
			row += '<td class="del_log" title="Удалить сообщение\nБез подтверждения!" id="dellog_'+d.key+'" key="'+d.key+'"><span class="ui-icon ui-icon-close"></span></td>'
		}
		/*$('#dellog_'+d.key).click(function(){
			log('del:' + $(this).attr('key'));
		});*/
		return row;
	}

	var UpdateDelProc = function() {
		$('td.del_log').unbind('click');
		$('td.del_log').bind('click', function(){
			//log('del:' + $(this).attr('key'));
			var row = this;
			$(row).parent().remove();
			$.getJSON('/api/logs/del?skey=' + config.skey+ '&lkey=' + $(this).attr('key'), function (data) {
				log('dellog complete');
				if (data.answer && data.answer == 'ok') {
					//$(row).parent().remove();
				}
			});
		});
	}

	var UpdateLog = function() {
		log('UpdateLog');
		var table = $("#log_table tbody");
		table.empty();

		$.getJSON('/api/logs/get?skey=' + config.skey, function (data) {
			//$("#progress").html("Обрабатываем...");
			log("getJSON parce");
			if (data.answer && data.answer == 'ok') {
				for(var i in data.logs){
					table.append('<tr>' + log_line(data.logs[i]) + '</tr>');
				}
			}
			UpdateDelProc();
		});
	}

	var Log_Make_SysList = function(list){
		list.empty();
		for(var i in config.systems){
			var s = config.systems[i];
			list.append('<option imei="'+s.imei+'" value="'+s.skey+'">'+s.desc+'</option>');
		}
	}

	$(document).ready(function() {
//		log('Загрузка закладки. События.');

		UpdateLog();

		config.syslist({
			id: 'log_syslist',
			change: function(){
				log('LOG syslist change');
				config.skey = $(this).attr('value');
				UpdateLog();
			}
		});

		/*
		var list = $('#log_syslist');

		Log_Make_SysList(list);
		config.updater.add('changedesc', function(msg) {
			//log('LOGS: Update descriptions');
			$(list).find('option[value="' + msg.data.skey + '"]').html(msg.data.desc);
		});
		config.updater.add('changeslist', function(msg) {
			Log_Make_SysList(list);
		});

		list.bind('change', function(){
			config.skey = $(this).attr('value');
			UpdateLog();
		});
		*/

		config.updater.add('addlog', function(msg) {
			if(msg.data.skey == config.skey){
				$("#log_table tbody tr:first").before('<tr>' + log_line(msg.data) + '</tr>');
				UpdateDelProc();
			}
		});
	});
	
})(jQuery);
