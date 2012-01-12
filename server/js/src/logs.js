/*
*/
(function(window){

var document = window.document,
	skey,	// skey выбранной системы
	table,
	tfoot,
	config = window.config,
	cursor;	// Курсор последнего запроса

var delete_log_listener = function() {
	//log('delete log line', this);
	this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
	config.helper.postJSON('/api/logs/del', {skey: skey, lkey: this.dataset.lkey}, function(data){
		//log('Del log line', data);
	});
}

var log_line = function(d) {
	var element = document.createElement('tr');
	var row = '<td>';
	if(config.admin){
		row += '<span class="ui-icon ui-icon-close del_log" style="display: inline-block;" title="Удалить сообщение\nБез подтверждения!" data-lkey="'+d.key+'"></span>'
	}
	row += dt_to_datetime(d.time)+'</td><td>'+d.text+'<!--td>'+d.label+'</td-->';

	element.innerHTML = row;
	if(config.admin){
		element.querySelector('td>span').addEventListener('click', delete_log_listener, false);
	}
	return element;
}

var load_next_lines = function(newcursor) {
	var url = '/api/logs/get?skey=' + skey;
	if(newcursor) url += '&cursor=' + newcursor;
	//log(' ==load_next_lines', cursor, url);
	tfoot.style.display = 'none';
	config.helper.getJSON(url, function (data) {
		if (data.answer && data.answer == 'ok') {
			//for(var i in data.logs){
			//	table.appendChild(log_line(data.logs[i]));
			//}
			// Другой вид обработки массива. Не уверен что так оптимальнее, но читается на мой взгял лучше.
			if(data.logs.length == 0){
				var tr = document.createElement('tr');
				tr.innerHTML = '<td colspan="2">Нет событий</td>';
				table.appendChild(tr);
			}
			[].forEach.call(data.logs, function(l){
				table.appendChild(log_line(l));
			});
			cursor = data.cursor;
			//log(' == data', data, cursor);
			tfoot.style.display = ((data.logs.length == 0) || (data.done))?'none':'';
		} else {
		}
	});
}

var UpdateLog = function() {
	config.helper.empty(table);
	load_next_lines();
}

var LogSysList;

config.updater.tabs[2] = function(){
	log('Tab Logs activated.');
	if(!LogSysList){
		table = document.querySelector('#log_table tbody');
		tfoot = document.querySelector('#log_table tfoot');
		tfoot.addEventListener('click', function(){
			load_next_lines(cursor);
		}, false);

		LogSysList = new SysList('log_syslist', {
			select: function(system){
				//console.log('LogSysList: selectSys', system);
				skey = system.skey;
				UpdateLog();
			}
		});
		//console.dir(LogSysList);
		//LogSysList.Rebuild();
		if(window.config.account.systems && window.config.account.sys_keys.length>0) {
			skey = window.config.account.systems[window.config.account.sys_keys[0]].skey;
			UpdateLog();
		}
		config.updater.add('addlog', function(msg) {
			if(msg.data.skey == skey) table.insertBefore(log_line(msg.data), table.firstChild);
		});
	}
}
	
})(window);
