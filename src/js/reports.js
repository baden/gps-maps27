"use strict";
(function(){

var geocoder;

var adrlist = [];

var getGeocode = function(adrlist, i, recur) {
	//console.log(adrlist[i]);
	//log('geoget at ' + i);
	if(adrlist[i].stop) log('stop: ' + i);

	if(geocoder) {
	geocoder.geocode({'latLng': new google.maps.LatLng(adrlist[i].pos[0], adrlist[i].pos[1]) }, function(results, status) {
		if(adrlist[i].stop) {log('stop2: ' + i); return;}
		if (status == google.maps.GeocoderStatus.OK) {
			var address = geocode_to_addr(results);
			$('#'+adrlist[i].id).html(address).attr('title', '');
			delete adrlist[i];
			//console.log(adrlist.some());
			var empty = true;
			for(var j in adrlist) {empty = false; break;}
			if(empty == true){
				$(".control").show();
			}

		} else {
			if(recur) {
				adrlist[i].cb = setTimeout(function(){getGeocode(adrlist, i, recur-1)}, 6000);
			} else {
				log('Error geocoding at ' + i + ' with ');
			}
		}
	});
	} else {
		delete adrlist[i];
	}
}

var genReport = function(skey, start, stop, title) {
	//$(".control").hide();
	for(var i in adrlist) { clearInterval(adrlist[i].cb); adrlist[i].stop = true; }

	$('#report_header').html('Отчет для системы ' + config.sysbykey[skey].desc + ' за ' + title + '');

	$( "#report tbody" ).empty();

	$.getJSON('/api/report/get?skey='+skey+'&from='+start+'&to='+stop, function (data) {
		//$("#progress").html("Обрабатываем...");
		log("getJSON parce");
		if (data.answer == 'ok') {
			//ParcePath(data);
			log("Show report...");

			$('#report_total_dist').html(ln_to_km(data.summary.length));
			$('#report_total_movetime').html(td_to_hms(data.summary.movetime));
			$('#report_total_avspeed').html(data.summary.speed.toFixed(1) + ' км/ч');
			$('#report_total_stoptime').html(td_to_hms(data.summary.stoptime));
			$('#report_total_maxspeed').html(data.summary.maxspeed.toFixed(1) + ' км/ч');

			var tbody = $( "#report tbody" );
			//console.log(tbody);
			adrlist = [];
			var cur_date = '';
			if(data.report.length == 0){
				tbody.append('<tr><td>Нет данных.</td></tr>');
			}

			for(var i in data.report){
				var ad_id = 'ad_' + i;
				var rec = data.report[i];
				var tp;

				switch(rec.type){
					case 'move': {
						if(rec.duration == 0) continue;
						tp = 'Движение</td><td>' + ln_to_km(rec.length) + ', ' + rec.speed.toFixed(1) + ' км/ч'; break
					}
					case 'stop': {
						//var rdiv = $('div');
						//console.log(rdiv);
						if(rec.duration < 5*60) tp = 'Остановка';
						else tp = 'Стоянка';
						adrlist.push({pos: rec.start.pos, id: ad_id, stop: false});

						tp += '</td><td id="' + ad_id + '" title="Дождитесь окончания обновления">' + rec.start.pos;
						break
					}
					default: {tp = 'Неизвестное событие (' + rec.type + ')'}
				}

				var events = '';

				for(var j in rec.events){
					log('Event: ', j, rec.events[j]);
					switch(j){
						case 'path_break': {
							events += '<span class="ui-icon ui-icon-alert" style="float:right;" title="Разрыв или повреждение трека. Данные отчета могут быть не точными." value="'+rec.events[j]+'"></span>';
							break
						}
					}
				}

				//log('cur date:', cur_date, 'date: ', dt_to_date(rec.start.time));
				if(cur_date != dt_to_date(rec.start.time)){
					cur_date = dt_to_date(rec.start.time);
					tbody.append( '<tr><td colspan="4" style="padding-top: 8px; padding-bottom: 8px; font-weight: bold;">' + cur_date + '</td></tr>');
				}
					
				tbody.append( "<tr>" +
					//"<td>" + dt_to_date(rec.start.time) + "</td>" + 
					'<td>' +
					'	<!--button class="ctl" style="float: left;"><span class="ui-icon ui-icon-cancel" title="Убрать из отчета информацию о движении"></span></button>' +
					'	<button class="ctl" style="float: left;"><span class="ui-icon ui-icon-locked" title="Оставить в отчете только информацию о движении"></span></button-->' +
					'	<!--button class="ctl" style="float: left;"><span class="ui-icon ui-icon-zoomin" title="Показать этот путь на карте" onclick="showMap(' + rec.start.pos + ',\'Стоянка ' + td_to_hms(rec.duration) + ' с ' + dt_to_time(rec.start.time) + ' по ' + dt_to_time(rec.stop.time) + '\', ' + rec.start.time + ');"></span></button-->' +
					'	<button class="ctl" style="float: left;"><span class="ui-icon ui-icon-zoomin" title="Показать на карте" onclick="showMap2(\'' + rec.start.time + '\',\'' + rec.stop.time + '\', \''+rec.type+'\');"></span></button>' +
					tp + events + "</td>" + 
					'<td>' + dt_to_time(rec.start.time) + ' - ' + dt_to_time(rec.stop.time) + "</td>" +
					'<td>' + /*td_to_hms(rec.duration) + */'' + td_to_time(rec.duration) + "</td>" +
				"</tr>" );
					
			}
			$(tbody).children('tr').click(function(){
				//log(this);
				$(this).css('font-weight', 'bold');
			});
			//log(adrlist);
			for(var i in adrlist){
				if(i==0){
					$(".control").hide();
				}
				//console.log(i);
				(function(i) {
					adrlist[i].cb = setTimeout(function(){getGeocode(adrlist, i, 50)}, 1000);
					//getGeocode(adrlist, i, 10);
				})(i);
			}

			$('.ctl').button(/*{ disabled: true }*/);
		}
	});

}
var purgeReport = function() {
	$('#report tbody').empty();
}

var showMap2 = function(from, to, type) {
	var map_div = $('#map_preview');
	if(map_div.length==0){
		var div = $('body')
		.append('<div id="map_overlay" class="ui-widget-overlay"></div>')
		.append('<div id="map_preview" style="">Загрузка карты, ожидайте...</div>');
		var map_div = $('#map_preview');
		$('#map_preview')
		.append('<div id="rmap"></div>')
		.append('<div id="map_close" style="position: absolute; top: -10px; left: 50%; margin-left: -20px;"><span class="ui-icon ui-icon-close"></span></div>');

		$('#map_close').button().click(function(){
			$('#rmap').gmap('destroy');
			$('#map_preview').remove();
			$('#map_overlay').remove();
		});

		$.getJSON('/api/geo/get?skey='+config.skey+'&from='+from+'&to='+to+'&options=nosubbounds', function (data) {
			//$("#progress").html("Обрабатываем...");
			//log("getJSON parce");
			if (data.answer && data.points.length > 0) {
				//ParcePath(data);
				log('ShowMap2:', data);

				var $map = $('#rmap').gmap({
					pos: new google.maps.LatLng(data.points[0][1], data.points[0][2]),
					zoom: 15,
					marker: 'center',
					//markertitme: title
				});
				var map = $($map).gmap('option', 'map');
				//console.log('Map: ', map);

				if(type == 'move'){
					map.fitBounds(new google.maps.LatLngBounds(
						new google.maps.LatLng(data.bounds.sw[0], data.bounds.sw[1]),
						new google.maps.LatLng(data.bounds.ne[0], data.bounds.ne[1])
					));

					var path = [];
					for(var i in data.points){
						var l = new google.maps.LatLng(data.points[i][1], data.points[i][2], false);
						path.push(l);
					}

					var flightPath = new google.maps.Polyline({
						//path: flightPlanCoordinates,
						map: map,
						path: path,
						strokeColor: config.ui.trackcolor || '#dc00dc',
						strokeOpacity: 1.0,
						strokeWeight: 3
					});

					// Маркеры начала и конца
					var marker_start = new google.maps.Marker({
						position: new google.maps.LatLng(path[0].lat(), path[0].lng()),
						map: map,
						title: 'Старт: ' + dt_to_datetime(data.points[0][0]),
							//tp + td_to_hms(dt) +
							//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
							//'\n' + dstop + '...' + dstart,
						icon: $.gmap.images['begin'],
			        		draggable: false
						//zIndex: -1000
					});
					var marker_finish = new google.maps.Marker({
						position: new google.maps.LatLng(path[path.length-1].lat(), path[path.length-1].lng()),
						map: map,
						title: 'Финиш: ' + dt_to_datetime(data.points[path.length-1][0]),
							//tp + td_to_hms(dt) +
							//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
							//'\n' + dstop + '...' + dstart,
						icon: $.gmap.images['end'],
			        		draggable: false
						//zIndex: -1000
					});
					//log('Marker: ', marker_start, marker_finish, path);
				} else {
					// Маркер стоянки
					var marker_stop = new google.maps.Marker({
						position: new google.maps.LatLng(data.points[0][1], data.points[0][2]),
						map: map,
						title: 'Стoянка: ' +
							'\n' + dt_to_datetime(data.points[0][0]) + '...' + dt_to_datetime(data.points[data.points.length-1][0]),
							//tp + td_to_hms(dt) +
							//'\n' + dt_to_datetime(data.points[data.stops[i].i][0]) + '...' + dt_to_datetime(data.points[data.stops[i].s][0]),
							//'\n' + dstop + '...' + dstart,
						icon: $.gmap.images['stop'],//Image_Stop,
			        		draggable: false
						//zIndex: -1000
					});
				}
				//flightPath.setMap(map);
			}
		});

		/*
		var mapOptions = {
			center: new google.maps.LatLng(48.5000, 34.599),
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			//mapTypeControl: false,
			disableDoubleClickZoom: true,
			draggableCursor: "default",
			zoom: 10,
		};
     
		map = new google.maps.Map(document.getElementById("map"), mapOptions);
		*/
	}
	//log(map_div);
}

window['showMap2'] = showMap2;

if(0){
	var showMap = function(lat, lon, title) {
		//$(this).css('border','2px solid green');
		//map = $("#map_div");
		//map.css({'left': me.pageX+10, 'top': me.pageY+10});
		var map_div = $('#map_preview');
		if(map_div.length==0){
			div = $('body')
			.append('<div id="map_overlay" class="ui-widget-overlay"></div>')
			.append('<div id="map_preview" style="">Ошибка отображения карты</div>');
			var map_div = $('#map_preview');
			$('#map_preview')
			.append('<div id="rmap"></div>')
			.append('<div id="map_close" style="position: absolute; top: -10px; left: 50%; margin-left: -20px;"><span class="ui-icon ui-icon-close"></span></div>');

			console.log();
			var $map = $('#rmap').gmap({
				pos: new google.maps.LatLng(lat, lon),
				zoom: 15,
				marker: 'center',
				markertitme: title
			});
			var map = $($map).gmap('option', 'map');

			$('#map_close').button().click(function(){
				$('#map_preview').gmap('destroy');
				$('#map_preview').remove();
				$('#map_overlay').remove();
			});

			/*
			var mapOptions = {
				center: new google.maps.LatLng(48.5000, 34.599),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				//mapTypeControl: false,
				disableDoubleClickZoom: true,
				draggableCursor: "default",
				zoom: 10,
			};
     
			map = new google.maps.Map(document.getElementById("map"), mapOptions);
			*/
		}
		log(map_div);
	} 
}

var Report_Make_SysList = function(list){
	list.empty();
	for(var i in config.systems){
		var s = config.systems[i];
		list.append('<option imei="'+s.imei+'" value="'+s.skey+'">'+s.desc+'</option>');
	}
}

$(document).ready(function() {

	if('google' in window) geocoder = new google.maps.Geocoder();
	$("#nav_reports").button("option", "disabled", true);

	$("#button_report_type_div").buttonset();

	$("#button_report_type_day").bind('change', function(){
		$('#report_div_type_interval').hide('slow');
		$('#report_div_type_day').show('slow');
		log('Boo');
	});
	$("#button_report_type_interval").bind('change', function(){
		$('#report_div_type_day').hide('slow');
		$('#report_div_type_interval').show('slow');
		log('Boo');
	});


	$('.control').button();

	$.datepicker.setDefaults( $.datepicker.regional[ "ru" ] );
	/*$( "#datepicker" ).datepicker($.datepicker.regional[ "ru" ], {altField: "#alternate",
		altFormat: "DD, d MM, yy"});*/

/*
	$('#indatepicker').datepicker({altField: "#alternate",
		altFormat: "DD, d MM, yy",
		onSelect: function(dateText, inst) {
			//console.log(inst);
			log(dateText);
			var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
			var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
			config.skey = $('#rep_syslist').attr('value');
			\genReport($('#rep_syslist').attr('value'), start, stop);
			//console.log(dateText);
			//console.log(inst);
		}
	});
	$('#control_day').click(function(){
		//alert('bu');
	});
*/

	$('#total tbody tr td').bind('click', function(me){
		log(me);
		//showMap();
	});

//	log('Загрузка закладки. Отчеты.');

if(0){
	var list = $('#rep_syslist');
	Report_Make_SysList(list);
	//}
	//updateLogList();
	config.updater.add('changedesc', function(msg) {
		log('LOGS: Update descriptions');
		//updateLogList();
		$(list).find('option[value="' + msg.data.skey + '"]').html(msg.data.desc);
		//console.log(l);
	});
	config.updater.add('changeslist', function(msg) {
		Report_Make_SysList(list);
	});
}
	//$('#log_syslist').bind('change', function(){
	/*
	list.bind('change', function(){
		config.skey = $(this).attr('value');
		//Report_Make_SysList(list);
	});
	*/


/*
		onSelect: function(dateText, inst) {
			//console.log(inst);
			log(dateText);
			var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
			var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
			config.skey = $('#rep_syslist').attr('value');
			genReport($('#rep_syslist').attr('value'), start, stop);
			//console.log(dateText);
			//console.log(inst);
		}
*/

	$('#report_date_by_day').datepicker({
		altField: "#report_dlg_byday_alternate",
			altFormat: "DD, d MM, yy"
	});

	$('#report_dlg_byday').dialog({
		modal: true,
		autoOpen: false,
		buttons:{
			'Отмена': function(){
				$(this).dialog("close");
			},
			'Построить отчет': function(){
				$(this).dialog("close");
				//var dt = $('#report_date_by_day').datepicker('getDate');
				//var start = $.datepicker.formatDate('ymmdd000000', dt);
				//var stop = $.datepicker.formatDate('ymmdd235959', dt);

				var start = $('#report_date_by_day').datepicker('getDate');
				var stop = new Date(start);
				stop.setHours(23);
				stop.setMinutes(59);
				stop.setSeconds(59);
				log('start:', start, 'stop:', stop);
				//SetDay(config.skey, start, stop);


				config.skey = $('#report_dlg_byday_syslist').val();

				genReport(config.skey, Date_to_url(start), Date_to_url(stop), $.datepicker.formatDate('dd/mm/yy', start));

				/*
				var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
				var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
				config.skey = $('#rep_syslist').attr('value');
				genReport($('#rep_syslist').attr('value'), start, stop);
				*/
			}
		},
		open: function(event, ui){
			log('Dialog open:', this, ui, event);
			var list = $('#report_dlg_byday_syslist');
			list.empty();
			for(var i in config.systems){
				var s = config.systems[i];
				list.append('<option imei="'+s.imei+'" value="'+s.skey+'"'+(s.skey==config.skey?' selected':'')+'>'+s.desc+'</option>');
			}
		}
	});



	var dates = $('#report_date_by_int_from, #report_date_by_int_to').datepicker({
	//var dates = $('#report_date_by_int_from, #report_date_by_int_to').datetimepicker({
		altFormat: "DD, d MM, yy",
		onSelect: function( selectedDate ) {
			var option = this.id == "report_date_by_int_from" ? "minDate" : "maxDate",
				instance = $( this ).data( "datepicker" );
				date = $.datepicker.parseDate(
					instance.settings.dateFormat ||
					$.datepicker._defaults.dateFormat,
					selectedDate, instance.settings );
			dates.not( this ).datepicker( "option", option, date );
		}
	});
	//log('Dates: ', dates);
	$('#report_date_by_int_from').datepicker('option', 'altField', '#report_dlg_byint_alternate_from');
	$('#report_date_by_int_to').datepicker('option', 'altField', '#report_dlg_byint_alternate_to');

	/*
	$('#report_dlg_byint_time_from_tp').timepicker({
		altField: '#report_dlg_byint_time_from',
		hourText: 'Часы',
		minuteText: 'Минуты',
    		amPmText: ['', ''],
		showPeriod: false,
		showLeadingZero: true,
		defaultTime: '00:00'
	});

	$('#report_dlg_byint_time_to_tp').timepicker({
		altField: '#report_dlg_byint_time_to',
		hourText: 'Часы',
		minuteText: 'Минуты',
    		amPmText: ['', ''],
		showPeriod: false,
		showLeadingZero: true,
		defaultTime: '23:59'
	});
	*/

	$('#report_dlg_byint').dialog({
		modal: true,
		autoOpen: false,
		width: 600,
		buttons:{
			'Отмена': function(){
				$(this).dialog("close");
			},
			'Построить отчет': function(){
				var start = $('#report_date_by_int_from').datepicker('getDate');
				var stop = $('#report_date_by_int_to').datepicker('getDate');

				var time_from = $('#report_dlg_byint_time_from').val();
				var time_to = $('#report_dlg_byint_time_to').val();
				log(time_from, /^\d\d:\d\d:\d\d$/.test(time_from), time_to, /^\d\d:\d\d:\d\d$/.test(time_to));
				if(!(/^\d\d:\d\d:\d\d$/.test(time_from)) || !(/^\d\d:\d\d:\d\d$/.test(time_to))){
					alert('Время должно задаваться в формате ЧЧ:MM:CC');
					return
				}
				$(this).dialog("close");

//				var start = $.datepicker.formatDate('ymmdd', dt_from) + time_from.replace(/:/g,'');
//				var stop = $.datepicker.formatDate('ymmdd', dt_to) + time_to.replace(/:/g,'');
				config.skey = $('#report_dlg_byint_syslist').val();

				start.setHours(parseInt(time_from.slice(0, 2), 10));
				start.setMinutes(parseInt(time_from.slice(3, 5), 10));
				start.setSeconds(parseInt(time_from.slice(6, 8), 10));

				stop.setHours(parseInt(time_to.slice(0, 2), 10));
				stop.setMinutes(parseInt(time_to.slice(3, 5), 10));
				stop.setSeconds(parseInt(time_to.slice(6, 8), 10));


/*				var start = $('#report_date_by_day').datepicker('getDate');
				var stop = new Date(start);
				stop.setHours(23);
				stop.setMinutes(59);
				stop.setSeconds(59);
				Date_to_url

*/

				genReport(config.skey, Date_to_url(start), Date_to_url(stop), ' интервал с ' + Date_to_datetime(start) + ' по ' + Date_to_datetime(stop));

				/*
				var start = date_to_url(dateText) + '000000'; //inst.currentYear, inst.currentMonth, inst.currentDay, '000000');
				var stop = date_to_url(dateText) + '235959'; //inst.currentYear, inst.currentMonth, inst.currentDay, '235959');
				config.skey = $('#rep_syslist').attr('value');
				genReport($('#rep_syslist').attr('value'), start, stop);
				*/
			}
		},
		open: function(event, ui){
			log('Dialog open:', this, ui, event);
			var list = $('#report_dlg_byint_syslist');
			list.empty();
			for(var i in config.systems){
				var s = config.systems[i];
				list.append('<option imei="'+s.imei+'" value="'+s.skey+'"'+(s.skey==config.skey?' selected':'')+'>'+s.desc+'</option>');
			}
		}
	});

	$('#report_btn_do_by_day').button({
		icons: {
			primary: "ui-icon-note"
		}})
		.click(function(){$('#report_dlg_byday').dialog('open')})
		.next().button({
		icons: {
			primary: "ui-icon-note"
		}})
		.click(function(){$('#report_dlg_byint').dialog('open')});

	if(1){
	$('#report_export_xls').button().click(function(){
		var tbody = $( "#report tbody" );
		log('export to XLS tbody:', tbody);
		var rows = [];

		var format5 = function(n){
			if(n<10) return '0000'+n;
			else if(n<100) return '000'+n;
			else if(n<1000) return '00'+n;
			else if(n<10000) return '0'+n;
			else return ''+n;
		}

		$("#report tbody tr").each(function(ind, el){
			var line = [];
			$(el).children('td').each(function(tdi, tdel){
				//rows['el_' + format5(ind) + '_' + format5(tdi)] = tdel.textContent;
				line.push(tdel.textContent);
			});
			rows.push(line);
		});
		log('rows:', rows);

		//rows['all'] = JSON.stringify(rows)

		//$.getJSON('/export/xls', {data: 'aaa'}, function (data) {
		$.ajax({
			url: '/export/xls',
			type: 'post',
			data: {data: JSON.stringify(rows)},
			success: function(data, textStatus, jqXHR){
				//window.location();
				var val = $.parseJSON(data);
				log('ok, data:', data, 'val:', val);
				$('#export_iframe').attr('src', '/export/get/' + encodeURI($('#report_header').text().replace(/[\/:?\\<*>|"']/gi,'-')) + '.xls?key=' + val.key);
				log('header', $('#report_header').html());
				//$('#export_iframe').html(data);
				//var url='.';
				//var win = window.open(url,'Download');
				//win.document.write(data);

			},
			//Ext.get('iframe').set({src:result.responseText });
		});
		//'ext-gen233'
	});
	}

});

})();



