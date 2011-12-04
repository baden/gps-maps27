/*
*/

(function($){
	var skey;	// skey выбранной системы

	var log_line = function(d) {
		var row = '<td>';
		if(config.admin){
			//row += '<span class="ui-icon ui-icon-close del_log" style="display: inline;" title="Удалить сообщение\nБез подтверждения!" id="dellog_'+d.key+'" key="'+d.key+'"></span>'
			row += '<span class="ui-icon ui-icon-close del_log" style="display: inline-block;" title="Удалить сообщение\nБез подтверждения!" data-lkey="'+d.key+'"></span>'
		}
		row += dt_to_datetime(d.time)+'</td><td>'+d.text+'<!--td>'+d.label+'</td-->';
		return row;
	}

	var UpdateDelProc = function() {
		$('span.del_log').unbind('click');
		$('span.del_log').bind('click', function(){
			//log('del:', this.dataset.lkey, this.parentNode.parentNode);
			this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
			/*
			$.getJSON('/api/logs/del?skey=' + skey+ '&lkey=' + this.dataset.lkey, function (data) {
				log('dellog complete');
				if (data.answer && data.answer == 'ok') {
				}
			});
			*/
			var formData = new FormData();
			formData.append('skey', skey);
			formData.append('lkey', this.dataset.lkey);
			var xhr = new XMLHttpRequest();
			xhr.open('POST', '/api/logs/del', true);
			xhr.onload = function(e) { log('Del log line', e); };
			xhr.send(formData);
			
			return;
		});
	}

	var UpdateLog = function() {
		//log('UpdateLog');
		var table = $("#log_table tbody");
		table.empty();
		config.working();

		$.getJSON('/api/logs/get?skey=' + skey, function (data) {
			//$("#progress").html("Обрабатываем...");
			log("getJSON parce");
			if (data.answer && data.answer == 'ok') {
				for(var i in data.logs){
					table.append('<tr>' + log_line(data.logs[i]) + '</tr>');
				}
			}
			UpdateDelProc();
			config.workingdone();
		});
	}

	var LogSysList;

	config.updater.tabs[2] = function(){
		log('Tab Logs activated.');
		if(!LogSysList){
			LogSysList = new SysList('log_syslist');
			LogSysList.selectSys = function(system){
				console.log('LogSysList: selectSys', system);
				skey = system.skey;
				UpdateLog();
			}
			log('1st act', window.config.account.systems);
			if(window.config.account.systems && window.config.account.systems.length>0) {
				skey = window.config.account.systems[0].skey;
				UpdateLog();
			}
			config.updater.add('addlog', function(msg) {
				if(msg.data.skey == skey){
					$("#log_table tbody tr:first").before('<tr>' + log_line(msg.data) + '</tr>');
					UpdateDelProc();
				}
			});
		}
	}

	$(document).ready(function() {
//		log('Загрузка закладки. События.');
//		if(config.skey) UpdateLog();

	});
	
})(jQuery);
