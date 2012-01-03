"use strict";

(function(win){
	var doc = win.document;
	var log = function(){ if(win.console) win.console.log(Array.prototype.slice.call(arguments));};
	var time = function(label){ if(win.console) win.console.time(label); }
	var timeEnd = function(label){ if(win.console) win.console.timeEnd(label); }
	doc.onselectstart = function(){return false;}	// Запретим выделение (внимание решение может быть не кроссбраузерно)

	var id = 0;
	var tests = [];
	var test_div = doc.getElementById('tests');

	var Test = function(){
		var me = this;

		me.id = id;
		id++;
		var task_div = doc.createElement('div');
		task_div.className = 'task';
		task_div.insertAdjacentHTML('beforeEnd',[
			'<div>ID:'+me.id+'</div>','<span class="delete">x</span>',''
		].join(''));

		task_div.querySelector('span.delete').addEventListener('click', function(){
			clearInterval(delay_interval);
			//log('del', me);
			test_div.removeChild(task_div);	// На самом деле это не совсем корректное удаление - память не освобождается.
		}, false);

		var span_delay = doc.createElement('div');
		var delay = Math.floor(Math.random() * 10) + 1;
		span_delay.innerText = ''+delay+' сек';
		task_div.appendChild(span_delay);

		var span_info = doc.createElement('div');
		span_info.innerText = 'Запрос: 0сек';
		task_div.appendChild(span_info);

		var span_conc = doc.createElement('div');
		span_conc.innerText = 'Конкур:';
		task_div.appendChild(span_conc);

		var subtask = function(){
			delay -= 1;
			if(delay<=0){
				clearInterval(delay_interval);
				span_delay.innerText = 'Запрос...';
				span_delay.classList.add('green');
				var xhr = new XMLHttpRequest();
				xhr.open('GET', 'http://api.gps.navi.cc/api/version', true);
				//xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xhr.onreadystatechange = function(){
					if(xhr.readyState == XMLHttpRequest.DONE){
						if(xhr.status == 200) {
							var done = +new Date();
							//log('ready', JSON.parse(xhr.responseText).concurent);
							span_info.innerText = 'Вып: '+((done-start)/1000).toFixed(3)+' сек';
							span_delay.innerText = 'Выполнено';
							span_delay.classList.remove('green');
							span_conc.innerText = 'Конкур:' + JSON.parse(xhr.responseText).concurent;
							delay = Math.floor(Math.random() * 10) + 1;
							delay_interval = setInterval(subtask, 1000);
						}
					}
				};
				var start = +new Date();

				//xhr.send(options.data.toQueryString());
				xhr.send(null);
			} else {
				span_delay.innerText = ''+delay+' сек';
			}
			//log('interval');
		}

		var delay_interval = setInterval(subtask, 1000);

		test_div.appendChild(task_div);
	}

	doc.getElementById('add_test').addEventListener('click', function(){
		tests.push(new Test());
	}, false);
})(this);
