# -*- coding: utf-8 -*-
from core import BaseApi
import webapp2
from google.appengine.ext import db
from datamodel import DBGeo
from datamodel import geo
from google.appengine.api.labs import taskqueue
import gc
import logging
import json

from core import MAXPOINTS

MAXSPEED = 210

class Task_Del(webapp2.RequestHandler):
	def get(self):
		from datetime import datetime
		skey = db.Key(self.request.get("skey"))

		#logging.info('API: /api/geo/del: call task');
		dtto = datetime.strptime(self.request.get("to"), "%y%m%d%H%M%S")
		DBGeo.DeleteTo(skey, dtto)


		#logging.info('API: /api/geo/del: delete %d records' % len(qu));

		#return {'answer': 'ok', 'result': 'End Task'}

		#if len(qu) < 200:
		#	logging.info('API: /api/geo/del: finish task');
		#	return {
		#		'answer': 'ok',
		#		'result': 'continue task for delete',
		#		'dateto': str(dtto),
		#		'count': len(qu)
		#	}

class Del(BaseApi):
	requred = ('admin', 'skey')
	def parcer(self, **argw):
		logging.info('API: /api/geo/taskdel: create task');
		url = "/api/geo/taskdel?skey=%s&to=%s" % (str(self.skey), self.request.get('to',''))
		countdown=0
		taskqueue.add(url = url, method="GET", countdown=countdown)

		return {
			'answer': 'ok',
			'result': 'add task for delete',
		}

class Task_DelAll(webapp2.RequestHandler):
	def get(self):
		from datetime import datetime

		dtto = datetime.strptime(self.request.get("to"), "%y%m%d%H%M%S")
		DBGeo.DeleteAllTo(dtto)

class DelAll(BaseApi):
	requred = ('admin')
	def parcer(self, **argw):
		logging.info('API: /api/geo/taskdelall: create task');
		url = "/api/geo/taskdelall?to=%s" % (self.request.get('to',''))
		countdown=0
		taskqueue.add(url = url, method="GET", countdown=countdown)

		return {
			'answer': 'ok',
			'result': 'add task for delete all' ,
		}

class GetO(webapp2.RequestHandler):
	def get(self):
		from math import log
		from datetime import datetime

		"""
		prof = "gc START: %s\n" % dir(gc)
		prof += "gc.get_count()=%s\n" % repr(gc.get_count())
		prof += "gc.get_debug()=%s\n" % repr(gc.get_debug())
		prof += "gc.get_threshold()=%s\n" % repr(gc.get_threshold())
		prof += "gc.isenabled()=%s\n" % repr(gc.isenabled())
		logging.info(prof)
		"""

		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		skey = self.request.get("skey")
		if skey is None:
			self.response.out.write(json.dumps({'answer': None}) + "\r")
			return

		system_key = db.Key(skey)

		#pfrom = self.request.get("from")
		dtfrom = datetime.strptime(self.request.get("from"), "%y%m%d%H%M%S")
		dhfrom = datetime(dtfrom.year, dtfrom.month, dtfrom.day, dtfrom.hour & ~7, 0, 0)

		dtto = datetime.strptime(self.request.get("to"), "%y%m%d%H%M%S")
		dhto = datetime(dtto.year, dtto.month, dtto.day, dtto.hour & ~7, 0, 0)

		pto = self.request.get("to")

		recs = DBGeo.all().ancestor(system_key).filter("date >=", dhfrom).filter("date <=", dhto).order("date")#.fetch(1000)
		points = []
		l_lat = []	# Список индексов (lat, index)
		l_lon = []	# Список индексов (lon, index)
		counts = []
		stops = []
		plat = 0.0
		plon = 0.0

		DS = 0.8
		MS = DS/(2**20)

		pl = 0
		b_lat_l = 90.0
		b_lon_l = 180.0
		b_lat_r = -90.0
		b_lon_r = -180.0

		maxp = 10000		# На данный момент ограничение 10тыс точек
		ind = 0 

		stop_start = None

		for rec in recs:
			logging.info('==> API:GEO:GET  fetch DBGeo[%s]' % rec.key().name())
			if maxp == 0: break
			else: maxp -= 1

			counts.append(rec.count)
			#c = rec.count
			#for i in xrange(c):
			#	point = rec.get_item(i)
			for point in rec.get_all():
				if point['time'] < dtfrom:	# Это не очень оптимально, нужно заменить поиском
					continue
				if point['time'] > dtto:	# Это не очень оптимально, нужно заменить поиском
					break

				if maxp == 0: break
				else: maxp -= 1

				d = max(MS, max(abs(plat - point['lat']), abs(plon - point['lon'])))
				plat = point['lat']
				plon = point['lon']
				
				points.append([
					#local.toUTC(point['time']).strftime("%d/%m/%Y %H:%M:%S"),
					point['time'].strftime("%y%m%d%H%M%S"),
					plat, #point['lat'],
					plon, #point['lon'],
					int(point['course']),
					#20,
					int(round(log(DS/d, 2), 0)),
				])
				l_lat.append((plat, ind))
				#l_lon.append((plon, ind))

				#if point['speed'] < 1.0:

				if point['fsource'] in (geo.FSOURCE_STOPACC, geo.FSOURCE_TIMESTOPACC, geo.FSOURCE_TIMESTOP):
					if stop_start is None:
						stop_start = {}
						stop_start['ind'] = ind
						stop_start['lat'] = plat
						stop_start['lon'] = plon
				if point['fsource'] == geo.FSOURCE_START:
					if stop_start is not None:
						stops.append({
							'i': stop_start['ind'],
							'p': (stop_start['lat'], stop_start['lon']),
							's': ind,
						})
						stop_start = None
				"""
				if point['fsource'] in (2, 3, 7):
					if stop_start is None:
						stop_start = {}
						stop_start['ind'] = ind
						stop_start['lat'] = plat
						stop_start['lon'] = plon
						stops.append({'i': ind, 'p': (plat, plon)})
					else:
						if stop_start['lat'] != plat or stop_start['lon'] != plon:
							stop_start['ind'] = ind
							stop_start['lat'] = plat
							stop_start['lon'] = plon
							stops.append({'i': ind, 'p': (plat, plon)})
				"""


				b_lat_l = min(b_lat_l, plat)
				b_lon_l = min(b_lon_l, plon)
				b_lat_r = max(b_lat_r, plat)
				b_lon_r = max(b_lon_r, plon)

				ind += 1

		# Zoom для первой и последней точки наивысший (отображать всегда)
		plen = len(points) 
		if plen>0:
			points[0][-1] = 0
			points[-1][-1] = 0

		# Вычислим subbounds (TBD)
		
		# Разобьем на 8 частей по lat
		l_lat.sort()
		#l_lon.sort()
		subbounds = []
		for i in range(8):
			l_lon = []
			i1 = plen * i // 8
			i2 = plen * (i+1) // 8
			#logging.info('i1 = %s' % str(i1))
			#logging.info('i2 = %s' % str(i2))
			for i3 in xrange(i1, i2):
				l_lon.append((points[l_lat[i3][1]][2], l_lat[i3][1]))
			l_lon.sort()
			for j in range(8):
				sbl = []
				j1 = len(l_lon) * j // 8
				j2 = len(l_lon) * (j+1) // 8
				#logging.info(' j1 = %s' % str(j1))
				#logging.info(' j2 = %s' % str(j2))
				nmin_lat = 180
				nmax_lat = -180
				for j3 in xrange(j1, j2):
					nmin_lat = min(nmin_lat, points[l_lon[j3][1]][1])
					nmax_lat = max(nmax_lat, points[l_lon[j3][1]][1])
					sbl.append(l_lon[j3][1])
				if(len(sbl)):
					subbounds.append({
						#'sw': (l_lat[i1][0], l_lon[j1][0]),
						#'ne': (l_lat[i2-1][0], l_lon[j2-1][0]),
						'sw': (nmin_lat, l_lon[j1][0]),
						'ne': (nmax_lat, l_lon[j2-1][0]),
						'i': sbl,
					})
				
		#subbounds.append(((b_lat_l, b_lon_l), ((b_lat_l+b_lat_r)/2, (b_lon_l+b_lon_r)/2)))

		jsonresp = {
			'answer': 'ok',
			#'bcount': len(recs),
			'count': len(points),
			#'counts': counts,
			'format': ["date", "lat", "lon", "course", "minzoom"],
			'points': points,
			'stops': stops,
			'bounds': {'sw': (b_lat_l, b_lon_l), 'ne': (b_lat_r, b_lon_r)},
			'subbounds': subbounds,
			#'slat': l_lat,
			#'slon': l_lon,
		}
		self.response.out.write(json.dumps(jsonresp, separators=(',',':')) + "\r")

		"""
		prof = "gc AFTER:\n"
		prof += "gc.get_count()=%s\n" % repr(gc.get_count())
		prof += "gc.get_debug()=%s\n" % repr(gc.get_debug())
		prof += "gc.get_threshold()=%s\n" % repr(gc.get_threshold())
		prof += "gc.isenabled()=%s\n" % repr(gc.isenabled())
		logging.info(prof)

		gc.collect()

		prof = "gc COLLECT:\n"
		prof += "gc.get_count()=%s\n" % repr(gc.get_count())
		prof += "gc.get_debug()=%s\n" % repr(gc.get_debug())
		prof += "gc.get_threshold()=%s\n" % repr(gc.get_threshold())
		prof += "gc.isenabled()=%s\n" % repr(gc.isenabled())
		#prof += "gc.get_objects()=%s\n" % repr(gc.get_objects())
		logging.info(prof)
		"""

class Get(BaseApi):
	requred = ('skey')
	def parcer(self):
		from math import log, sqrt
		from datamodel.geo import distance
		from datetime import datetime

		"""
		prof = "gc START: %s\n" % dir(gc)
		prof += "gc.get_count()=%s\n" % repr(gc.get_count())
		prof += "gc.get_debug()=%s\n" % repr(gc.get_debug())
		prof += "gc.get_threshold()=%s\n" % repr(gc.get_threshold())
		prof += "gc.isenabled()=%s\n" % repr(gc.isenabled())
		logging.info(prof)
		"""


		#pfrom = self.request.get("from")
		dtfrom = datetime.strptime(self.request.get("from"), "%y%m%d%H%M%S")

		dtto = datetime.strptime(self.request.get("to"), "%y%m%d%H%M%S")

		options = self.request.get('options', '').split(',')
		#logging.info('options=%s' % repr(options))

		points = []
		l_lat = []	# Список индексов (lat, index)
		l_lon = []	# Список индексов (lon, index)
		counts = []
		stops = []
		plat = 0.0
		plon = 0.0

		DS = 0.8
		MS = DS/(2**20)

		pl = 0
		b_lat_l = 90.0
		b_lon_l = 180.0
		b_lat_r = -90.0
		b_lon_r = -180.0

		ind = 0 

		stop_start = None
		prev_point = None

		maxp = MAXPOINTS
		for point in DBGeo.get_items_by_range(self.skey, dtfrom, dtto, maxp):
			if point['fsource'] in [geo.FSOURCE_DU, geo.FSOURCE_UMAX]:
				continue
			#logging.info('point=%s' % repr(point))
			d = max(MS, max(abs(plat - point['lat']), abs(plon - point['lon'])))
			plat = point['lat']
			plon = point['lon']

			if prev_point:
				if point['speed'] > MAXSPEED:
					continue
				dist = distance(point, prev_point)
				dt = point['time'] - prev_point['time']
				dt = dt.days * 24 * 3600 + dt.seconds
				cspeed = (dist * 3600 / dt) if dt>0 else 0
				if cspeed > 300:			# Надеюсь таким образом избавиться от глюков
					continue
			else:
				dist = 0
				dt = 0
				cspeed = 0

			prev_point = point

			if stop_start is None:
				points.append([
					#point['time']).strftime("%d/%m/%Y %H:%M:%S",
					point['time'].strftime("%y%m%d%H%M%S"),
					plat, #point['lat'],
					plon, #point['lon'],
					int(point['course']),
					#20,
					int(round(log(DS/d, 2), 0)),
					#{'dist': dist, 'speed': point['speed'], 'dt': dt, 'speed2': cspeed},
				])
			else:
				points.append([
					#point['time']).strftime("%d/%m/%Y %H:%M:%S",
					point['time'].strftime("%y%m%d%H%M%S"),
					stop_start['lat'],
					stop_start['lon'],
					int(point['course']),
					#20,
					int(round(log(DS/d, 2), 0)),
					#{'dist': dist, 'speed': point['speed'], 'dt': dt, 'speed2': cspeed},
				])

			l_lat.append((plat, ind))
			#l_lon.append((plon, ind))

			#if point['speed'] < 1.0:

			if point['fsource'] in (geo.FSOURCE_STOPACC, geo.FSOURCE_TIMESTOPACC, geo.FSOURCE_TIMESTOP):
				if stop_start is None:
					stop_start = {}
					stop_start['ind'] = max(0, ind-1)
					#stop_start['ind'] = ind
					stop_start['lat'] = plat
					stop_start['lon'] = plon
			elif point['fsource'] == geo.FSOURCE_START:
				if stop_start is not None:
					stops.append({
						'i': stop_start['ind'],
						'p': (stop_start['lat'], stop_start['lon']),
						's': ind,
					})
					stop_start = None
			else:
				stop_start = None
			"""
			if point['fsource'] in (2, 3, 7):
				if stop_start is None:
					stop_start = {}
					stop_start['ind'] = ind
					stop_start['lat'] = plat
					stop_start['lon'] = plon
					stops.append({'i': ind, 'p': (plat, plon)})
				else:
					if stop_start['lat'] != plat or stop_start['lon'] != plon:
						stop_start['ind'] = ind
						stop_start['lat'] = plat
						stop_start['lon'] = plon
						stops.append({'i': ind, 'p': (plat, plon)})
			"""


			b_lat_l = min(b_lat_l, plat)
			b_lon_l = min(b_lon_l, plon)
			b_lat_r = max(b_lat_r, plat)
			b_lon_r = max(b_lon_r, plon)

			ind += 1

		# Zoom для первой и последней точки наивысший (отображать всегда)
		plen = len(points) 
		if plen>0:
			points[0][4] = 0
			points[-1][4] = 0

		# Вычислим subbounds (TBD)

	
		# Разобьем на 8 частей по lat
		l_lat.sort()
		#l_lon.sort()
		subbounds = []

		if 'nosubbounds' not in options:
			sbs_lat = int(sqrt(plen) / 24) + 1
			sbs_lon = int(sqrt(plen) / 24) + 1
			for i in range(sbs_lat):
				l_lon = []
				i1 = plen * i // sbs_lat
				i2 = plen * (i+1) // sbs_lat
				#logging.info('i1 = %s' % str(i1))
				#logging.info('i2 = %s' % str(i2))
				for i3 in xrange(i1, i2):
					l_lon.append((points[l_lat[i3][1]][2], l_lat[i3][1]))
				l_lon.sort()
				for j in range(sbs_lon):
					sbl = []
					j1 = len(l_lon) * j // sbs_lon
					j2 = len(l_lon) * (j+1) // sbs_lon
					#logging.info(' j1 = %s' % str(j1))
					#logging.info(' j2 = %s' % str(j2))
					nmin_lat = 180
					nmax_lat = -180
					for j3 in xrange(j1, j2):
						nmin_lat = min(nmin_lat, points[l_lon[j3][1]][1])
						nmax_lat = max(nmax_lat, points[l_lon[j3][1]][1])
						sbl.append(l_lon[j3][1])
					if(len(sbl)):
						subbounds.append({
							#'sw': (l_lat[i1][0], l_lon[j1][0]),
							#'ne': (l_lat[i2-1][0], l_lon[j2-1][0]),
							'sw': (nmin_lat, l_lon[j1][0]),
							'ne': (nmax_lat, l_lon[j2-1][0]),
							'i': sbl,
						})
		#subbounds.append(((b_lat_l, b_lon_l), ((b_lat_l+b_lat_r)/2, (b_lon_l+b_lon_r)/2)))

		return {
			'answer': 'ok',
			#'bcount': len(recs),
			'count': len(points),
			#'counts': counts,
			'format': ["date", "lat", "lon", "course", "minzoom"],
			'points': points,
			'stops': stops,
			'bounds': {'sw': (b_lat_l, b_lon_l), 'ne': (b_lat_r, b_lon_r)},
			'subbounds': subbounds,
			#'slat': l_lat,
			#'slon': l_lon,
		}
		#self.response.out.write(json.dumps(jsonresp, separators=(',',':')) + "\r")

		"""
		prof = "gc AFTER:\n"
		prof += "gc.get_count()=%s\n" % repr(gc.get_count())
		prof += "gc.get_debug()=%s\n" % repr(gc.get_debug())
		prof += "gc.get_threshold()=%s\n" % repr(gc.get_threshold())
		prof += "gc.isenabled()=%s\n" % repr(gc.isenabled())
		logging.info(prof)

		gc.collect()

		prof = "gc COLLECT:\n"
		prof += "gc.get_count()=%s\n" % repr(gc.get_count())
		prof += "gc.get_debug()=%s\n" % repr(gc.get_debug())
		prof += "gc.get_threshold()=%s\n" % repr(gc.get_threshold())
		prof += "gc.isenabled()=%s\n" % repr(gc.isenabled())
		#prof += "gc.get_objects()=%s\n" % repr(gc.get_objects())
		logging.info(prof)
		"""
#TBD! Переделать на BaseApi
class Info(webapp2.RequestHandler):
	def get(self):
		from datetime import datetime

		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		skey = self.request.get("skey")
		if skey is None:
			self.response.write(json.dumps({'answer': None}) + "\r")
			return

		skey = db.Key(skey)
		dtpoint = datetime.strptime(self.request.get("point"), "%y%m%d%H%M%S")

		point = DBGeo.get_by_datetime(skey, dtpoint)
		
		jsonresp = {
			'answer': 'ok',
			'point': {
				#'count': pointr.i_count,
				'lat': point['lat'],
				'lon': point['lon'],
				'speed': '%.1f' % point['speed'],
				'course': point['course'],
				'vout': '%.1f' % point['vout'],
				'vin': '%.2f' % point['vin'],
				'sats': point['sats'],
				'fsource': point['fsourcestr']
			}
		}
		self.response.write(json.dumps(jsonresp) + "\r")

#TBD! Переделать на BaseApi
class Dates(webapp2.RequestHandler):
	def get(self):
		from bisect import insort
		from datetime import datetime

		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		skey = self.request.get("skey")
		if skey is None:
			self.response.out.write(json.dumps({'answer': None}) + "\r")
			return

		month = self.request.get("month")
		if month is None:
			self.response.out.write(json.dumps({'answer': None}) + "\r")
			return

		sy = int(month[:4])
		sm = int(month[4:])

		ny = sy
		nm = sm + 1
		if nm > 12:
			nm = 1
			ny += 1

		system_key = db.Key(skey)

		#req = DBGeo.all(keys_only=True).ancestor(system_key).filter('date >=', datetime(sy,sm,1)).filter('date <', datetime(ny,nm,1)).order('date').fetch(31*3) # пачки по 8 часов
		req = DBGeo.all().ancestor(system_key).filter('date >=', datetime(sy,sm,1)).filter('date <', datetime(ny,nm,1)).order('date').fetch(31+2) # Месяц +- 2 дня

		#dates = []
		#months = []
		days = []
		dlen = 0
		for rec in req:
			dlen+=1;
			"""
			#dt = rec.name()[4:12]
			dt = rec.key().name()[4:12]
			y = int(dt[0:4])
			m = int(dt[4:6])
			d = dt[6:8]
			"""

			dt = rec.get_first()['time'].strftime("%Y%m%d")
			#logging.info(dt)
			y = int(dt[0:4])
			m = int(dt[4:6])
			d = int(dt[6:8])

			if y == sy and m == sm:
				if d not in days:
					insort(days, d)

			dt = rec.get_last()['time'].strftime("%Y%m%d")
			#logging.info(dt)
			y = int(dt[0:4])
			m = int(dt[4:6])
			d = int(dt[6:8])

			if y == sy and m == sm:
				if d not in days:
					insort(days, d)

			#if dt not in dates:
			#	dates.append("%s" % dt)

		jsonresp = {
			'answer': 'ok',
			#'dates': dates,
			#'months': months,
			'year': sy,
			'month': sm,
			'days': days,
			'len': dlen,
		}

		self.response.out.write(json.dumps(jsonresp, indent=2) + "\r")	#sort_keys=True,

"""
class Geo_Last(BaseApi):
	requred = ('account')
	def parcer(self, **argw):
		from datamodel.geo import getGeoLast

		skey = self.request.get("skey", None)
		if skey is not None:
			systems = [db.get(db.Key(skey))]
		else:
			systems = self.account.systems
		recs = []
		for s in systems:
			recs.append({
				'skey': str(s.key()),
				'imei': s.imei,
				'desc': s.desc,
				'data': getGeoLast(s.key()),
			})

		return {
			'answer': 'ok',
			'imeis': repr([r.imei for r in systems]),
			'geo': recs,
			#'dates': dates,
			#'months': months,
			#'years': years,
			#'len': dlen,
		}
"""
class Last(BaseApi):
	requred = ('account')
	def parcer(self, **argw):
		from datamodel.geo import getGeoLast
		return {
			'answer': 'ok',
			'data': getGeoLast(self.account.systems_key)
		}


class Count(BaseApi):
	requred = ('skey')
	def parcer(self):
		count = DBGeo.get_items_count(self.skey)
		return {'answer': 'ok',
			'count': count,
		}

class Report(BaseApi):
	requred = ('skey')
	def parcer(self):
		from datetime import datetime

		points = []

		#after = self.request.get('after', 'today')
		dtfrom = datetime.strptime(self.request.get("from"), "%y%m%d%H%M%S")
		dtto = datetime.strptime(self.request.get("to"), "%y%m%d%H%M%S")

		for point in DBGeo.get_items_by_range(self.skey, dtfrom, dtto, MAXPOINTS):
			points.append((
				point['time'].strftime("%y%m%d%H%M%S"),
				point['lat'], point['lon'],
				point['sats'],
				point['vout'],
				point['vin'],
				point['speed'],
				point['fsource'], point['photo'], 0
			));

		return {'answer': 'ok',
			'format': ('datetime', 'lat', 'lon', 'sats', 'vout', 'vin', 'speed', 'photo'),
			#'points': points[::-1]		# Выдадим в обратной последовательности
			'points': points
		}

class Purge(BaseApi):
	requred = ('admin', 'skey')
	def parcer(self, **argw):
		from datetime import datetime

		dt = datetime.strptime(self.request.get("dt"), "%y%m%d%H%M%S")
		rec = DBGeo.get_by_date(self.skey, dt)
		rec.purge_item_by_dt(dt)
		rec.put()
		#logging.info('API: /api/geo/purge: %s' % repr(0));
		#DBGeo.DeleteTo(self.skey, dtto)



		#return {'answer': 'ok', 'result': 'End Task'}

		#if len(qu) < 200:
		#	logging.info('API: /api/geo/del: finish task');
		#	return {
		#		'answer': 'ok',
		#		'result': 'continue task for delete',
		#		'dateto': str(dtto),
		#		'count': len(qu)
		#	}

		return {
			'answer': 'ok',
			'result': 'purge one point',
		}
