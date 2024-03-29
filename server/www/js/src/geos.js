/*
*/

(function(){


	//$('#geomap').bind('click', function(){
	//	log('1111');
	//});
	//log($('#geos_body table tr:first th:last')[0].offsetLeft);

	var $gmap = null;
	var gmap = null;
	var gmarker;
	var $p = $('#geos_body table tr:first th:last')[0];
	var skey;
	var GeosSysList;
	var date;

	//$('#geomap').css('left', $p.offsetLeft+$p.offsetWidth);

	config.updater.tabs[3] = function(){

	log('config', config);
	if(config.admin){
        tbody.addEventListener('contextmenu', function(ev){
		if(ev.target.nodeName.toLowerCase() == 'td'){
			var par = ev.target.parentNode.childNodes;
			var lat = parseFloat(par[1].innerHTML); //.slice(4,-4)
			var lon = parseFloat(par[2].innerHTML); //.slice(4,-4)
			var row = ev.target.parentNode;
			if(!isNaN(lat) && !isNaN(lon) && (ev.target.innerHTML.search(/\d\d:\d\d:\d\d/)==0)){
				var dt = ev.target.parentNode.dataset.dt;
				log('geo purge', lat, lon);
				var del_popup = document.createElement('div');
				del_popup.innerHTML = 'Удалить точку ' + par[0].innerHTML;
				$(del_popup).dialog({
					modal: true
					, position: 'left'
					, buttons: { "Нет": function() { $(this).dialog("close"); }, "Да": function() {
						config.helper.getJSON('/api/geo/purge?skey=' + skey + '&dt=' + dt, function (data) {
							if (data.answer && data.answer == 'ok') {
								log('success purge.');
							}
						});
						
						row.parentNode.removeChild(row);
						$(this).dialog("close"); 
					}}
					, close: function(event, ui) { $(this).dialog('destroy'); }
				});
				event.preventDefault();
			}
		}
	}, false);
	}


		$('#geomap').css('left', $p.offsetLeft+$p.offsetWidth);
		if(!$gmap){
			//log('== create');
			//$("#geomap").resizable();
			$gmap = $('#geomap').gmap({
					//pos: new google.maps.LatLng(45, 35),
					//marker: 'center',
					//markertitme: title,
					zoom: 15
			});
			gmap = $($gmap).gmap('option', 'map');

			gmarker = new google.maps.Marker({
		        	//position: new google.maps.LatLng(data.stops[i].p[0], data.stops[i].p[1]),
			        map: gmap,
				title: 'Положение',
				icon: $.gmap.images['center'],
			        draggable: false
			});

			GeosSysList = new SysList('geos_syslist', {
				select: function(system) {
					log('report.select', system);
					skey = system.skey;
					genReport();
				}
			});
			//GeosSysList.Rebuild();
			
			if(window.config.account.systems && window.config.account.sys_keys.length>0) {
				skey = window.config.account.systems[window.config.account.sys_keys[0]].skey;
				genReport();
			}

		} else {
			log('== resize');
			google.maps.event.trigger(gmap, 'resize');
		}

		//var $p = $('#geos_body table tr:first th:last')[0];
		//$('#geomap').resize();

		/*$('#geos_viewtype').buttonset({
		}).change(function(){
			log('===> geo: buttonset_change');
			genReport();
		});*/
		$('#geos_datepicker').datepicker({
			dateFormat: 'dd.mm.yy',
			onSelect: function( selectedDate ) {
				genReport();
			}
		});

		$('#geos_datepicker').datepicker("setDate", new Date());

		setTimeout(function(){
			genReport();
		}, 500);

	}


	//var tbody = $('#geos_body table tbody');
	var tbody = document.body.querySelector('#geos_body table tbody');
	var skey;

	var fsource = {
		0: "-",
		1: "SUDDENSTOP",
		2: "STOPACC",
		3: "TIMESTOPACC",
		4: "SLOW",
		5: "TIMEMOVE",
		6: "START",
		7: "TIMESTOP",
		8: "ANGLE",
		9: "DELTALAT",
		10: "DELTALONG",
		11: "DELTA",
		12: "DU",
		13: "UMAX"
	};

	var td = function(value){
		var res = '';
		$.each(value, function(i, v){
			res += '<td>' + v + '</td>'
		});
		return res;
	}
	tbody.addEventListener('mouseover', function(ev){
		//log('mouseover', ev.target);
		if(ev.target.nodeName.toLowerCase() == 'td'){
			var par = ev.target.parentNode.childNodes;
			var lat = parseFloat(par[1].innerHTML); //.slice(4,-4)
			var lon = parseFloat(par[2].innerHTML); //.slice(4,-4)
			if(!isNaN(lat) && !isNaN(lon)){
				//log('geo preview', lat, lon);
				var pos = new google.maps.LatLng(lat, lon);
				gmap.panTo(pos);
				gmarker.setPosition(pos);
			}
		}
	}, false);


	var genReport = function(){
		log('GEOS: Update report');
		//skey = $('#geos_syslist').val();

		//date = $.datepicker.formatDate('ymmdd', $('#geos_datepicker').datepicker('getDate'));
		date = $('#geos_datepicker').datepicker('getDate');
		if(!date) return;
		log('date', date);
		//if(date == '') return;

//		$.getJSON('/api/geo/report', {skey: skey, from: date+'000000', to: date+'235959'}, function (data) {
//		$.getJSON('/api/geo/report', {skey: skey, from: Date_to_url(Date_to_daystart(date)), to: Date_to_url(Date_to_daystop(date))}, function (data) {
		console.time('table-clear');
		tbody.innerHTML = '';
		console.timeEnd('table-clear');
		config.helper.getJSON('/api/geo/report?skey=' + skey + '&from=' + Date_to_url(Date_to_daystart(date)) + '&to=' + Date_to_url(Date_to_daystop(date)), function (data) {
			if (data.answer && data.answer == 'ok') {

				var vdata = {
					vout: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					},
					vin: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					},
					speed: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					},
					sats: {
						data: new google.visualization.DataTable(),
						vmin: 1000, vmax: -1000, vsum: 0
					}
				};
				vdata.vout.data.addColumn('string', 'x');	// Часы
				vdata.vin.data.addColumn('string', 'x');	// Часы
				vdata.speed.data.addColumn('string', 'x');	// Часы
				vdata.sats.data.addColumn('string', 'x');	// Часы

			        vdata.vout.data.addColumn('number', 'Основное питание');
			        vdata.vin.data.addColumn('number', 'Резервное питание');
			        vdata.speed.data.addColumn('number', 'Скорость');
			        vdata.sats.data.addColumn('number', 'Спутники');

				var phm = '';
				var vcnt = 0;
				var p;

				var _slice=5, _tail='';
				/*if(data.points.length > 10000){
					_slice = 3;
					_tail = '00';
				} else */if(data.points.length > 200){
					_slice = 4;
					_tail = '0';
				} 

				var add_data = function(name, digits){
					var value = parseFloat((vdata[name].vsum/vcnt).toFixed(digits));
					vdata[name].data.addRow([dt_to_time(p[0]).slice(0,_slice)+_tail, value]);
					vdata[name].vsum = 0;
					vdata[name].vmin = Math.min(vdata[name].vmin, value);
					vdata[name].vmax = Math.max(vdata[name].vmax, value);
				}

				document.getElementById('geos_stats').innerHTML = '' + data.points.length + ' точек';

				//tbody.empty();
				//var progress = $( "#progressbar" );
				//progress.progressbar({value: 0});
				for(var i in data.points){
					p = data.points[i];
					vdata.vout.vsum += p[4];
					vdata.vin.vsum += p[5];
					vdata.speed.vsum += p[6];
					vdata.sats.vsum += p[3];
					vcnt += 1;

					if(phm != dt_to_time(p[0]).slice(0,_slice)){
						phm = dt_to_time(p[0]).slice(0,_slice);

						add_data('vout', 2);
						add_data('vin', 3);
						add_data('speed', 2);
						add_data('sats', 2);

						vcnt = 0;
					}
					//vdata.addRow([p[0].toString(), 1.2]);
				}
				
				console.time('table-string');
				var tbl = [];
				for(var i=data.points.length-1,l=data.points.length; i>=0; i--){
					var p = data.points[i];
					tbl.push('<tr data-dt="' + p[0] + '">'+td([dt_to_time(p[0]), p[1].toFixed(5), p[2].toFixed(5), p[3], p[6].toFixed(1), p[4].toFixed(1), p[5].toFixed(2), fsource[p[7]], p[8]])+'</tr>');
				}
				//tbody.append(tbl.join(''));
				console.timeEnd('table-string');
				console.time('table-render');
				tbody.innerHTML = tbl.join('');
				console.timeEnd('table-render');
				//google.maps.event.trigger(gmap, 'resize');
				$('#geomap').css('left', $p.offsetLeft+$p.offsetWidth);
				
				/*if(vcnt){
						add_data('vout', 2);
						add_data('vin', 3);
						add_data('speed', 2);
						add_data('sats', 2);
				}*/

				// Create and draw the visualization.
				var draw_data = function(name, title){
					//vdata[name].data.sort([{column: 0}]);
					$('#geos_vis_' + name).empty();
					if(vdata[name].data.getNumberOfRows()>0){
						//var delta = (vdata[name].vmax - vdata[name].vmin) / 1.0;
						var chart = new google.visualization.LineChart(document.getElementById('geos_vis_' + name));
						chart.draw(vdata[name].data, {
							curveType: "function",
							title: title,
							width: 700, height: 400,
							vAxis: {minValue: vdata[name].vmin /*- delta*/, maxValue: vdata[name].vmax /*+ delta*/},
							chartArea:{left:40,top:20,width:650,height:330},
		                  			legend: 'none',
							hAxis: {slantedTextAngle: 90}
		                		});
					}
				}

				draw_data('vout', 'Основное питание');
				draw_data('vin', 'Резервное питание');
				draw_data('speed', 'Скорость (средняя)');
				draw_data('sats', 'Спутники (усредненное значение)');
			}
			/*
			var $p = $('#geos_body table tr:first th:last')[0];
			$('#geomap').css('left', $p.offsetLeft+$p.offsetWidth);
			$('#geos_body table tr').unbind('mouseover');
			$('#geos_body table tr').bind('mouseover', function(){
				//var lat = parseFloat($(this).children()[1].slice(4,-4));
				//var lon = parseFloat($(this).children()[2].slice(4,-4));
				if($(this).children()[1] && $(this).children()[2]){
					var lat = parseFloat($(this).children()[1].innerHTML); //.slice(4,-4)
					var lon = parseFloat($(this).children()[2].innerHTML); //.slice(4,-4)
					if(!isNaN(lat) && !isNaN(lon)){
						//log('geo preview', lat, lon);
						var pos = new google.maps.LatLng(lat, lon);
						gmap.panTo(pos);
						gmarker.setPosition(pos);
					}
				}
			});
			*/
		});


	}

	$('span.showchart').click(function(){
		var name = $(this).attr('data-value');
		log('showchart', name);
		//if(vdata[name].data.getNumberOfRows()>0){
			$('.geos_vis').hide();
			$('#geos_vis_' + name).show();
			$('#geos_previev').show('fast');
		//}
	});

	/*config.updater.add('geo_change', function(msg) {
		log('GEOS: geo_change: ', msg.data);
		if(skey == msg.data.skey) {
			if($('#geos_type_last').attr('checked')) genReport();
		}
	});*/

	config.updater.add('geo_change_last', function(msg) {
		log('GEOS: geo_change: ', msg.data);
		if(skey == msg.data.skey) {
			if($('#geos_type_last').attr('checked')) genReport();
		}
	});

	/*
	config.syslist({
		id: 'geos_syslist',
		change: function(){
			genReport();
		}
	});

	if(config.skey) genReport();
	*/



})();
