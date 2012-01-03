# -*- coding: utf-8 -*-

"""
	Все что касается GPS точек
"""

from google.appengine.ext import db
from datetime import datetime, timedelta
import struct
#import zlib
import logging

ROOT_NAMESPACE = 'point'

TAIL_LEN = 20

def repr_short(point):
	return [
		point['time'].strftime("%y%m%d%H%M%S"),
		point['lat'], #point['lat'],
		point['lon'], #point['lon'],
		int(point['course']),
	]

def repr_middle(point):
	return {
		#'count': pointr.i_count,
		#'time': point['time'].strftime("%Y-%m-%d %H:%M:%S"),	# dt
		'time': point['time'].strftime("%y%m%d%H%M%S"),	# dt
		'lat': point['lat'],
		'lon': point['lon'],
		'speed': '%.1f' % point['speed'],
		'course': point['course'],
		'vout': '%.1f' % point['vout'],
		'vin': '%.2f' % point['vin'],
		'sats': point['sats'],
		#'fsource': point['fsourcestr'],
	}



"""
 Гео-данные

 Данные хранятся пачками.
 Каждатя пачка данных содержит точки за сутки.
 Запись имеет ключ вида: YYYYMMDD
 где
	YYYY - год
	MM - месяц
	DD - день
 Максимальное количество точек в одной записи = 28800 точек (*36 = 1036800 байт ~ 0.99МБ)
 Т.е. при сохранении каждую секунду - всего на треть суток.
 Поэтому использование столь частой записи запрещено (!!!)

 !Предложение! (TBD!!!)
 Если при очередном добавлении количество точек достигает 28800 штук, то создаются пакеты
  geo_YYYYMMDDHH (столько сколько нужно с шагом 8 часов) и работа с ними идет как обычно.

 Т.е. другими словами при поиске точек в Workere, сначала ищется пакет с ключем geo_YYYYMMDD, и если таковой не
 найден, то пакет с ключем geo_YYYYMMDDHH.

 Процедуру Geo_Get, похоже, переделывать не придется.

"""

FSOURCE = {
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
}

#PACK_STR = 'iffffffBBBBiiiiiiii'
PACK_STR = 'iffffffBBBBi'
#           ^^^^^^^^^^^^
#           │││││││││││└ res3 (int)
#           ││││││││││└─ res2 (byte)
#           │││││││││└── res1 (byte)
#           ││││││││└─── fsource (byte)
#           │││││││└──── sats (byte)
#           ││││││└───── vin (float)
#           │││││└────── vout (float)
#           ││││└─────── course (float)
#           │││└──────── speed (float)
#           ││└───────── lon (float)
#           │└────────── lat (float)
#           └─────────── seconds (int)
PACK_LEN = 36
MAX_RECS = 1024*1024//PACK_LEN		# Максимальное количество точей в одной записи

assert(struct.calcsize(PACK_STR) == PACK_LEN)
# !!! time должен всегда! идти первым и иметь тип int(i)

class DBGeo(db.Model):
	date = db.DateTimeProperty()				# Дата/время смещения
	bin = db.BlobProperty(default=None)			# Упакованные данные
	# Остальные параметры, возможно будут использоваться только на этапе отладки и в продакшине будут убраны.
	i_count = db.IntegerProperty(default=0)			# Кол-во точек в пакете
	i_first = db.DateTimeProperty()				# Время первой точки
	i_last = db.DateTimeProperty()				# Время последней точки
	extend = db.ListProperty(unicode, default=None)		# Дополнительная информация за текущий период

	@property
	def count(self):
		if self.bin is None:
			return 0
		else:
			return len(self.bin) / PACK_LEN

	def u_to_v(self, u):
		return {
			'seconds': u[0], 
			'time': self.date + timedelta(seconds = u[0]),
			'lat': u[1],
			'lon': u[2],
			'speed': u[3],
			'course': u[4],
			'vout': u[5],
			'vin': u[6],
			'sats': u[7],
			'fsource': u[8],
			'fsourcestr': FSOURCE[u[8]],
		}
	def v_to_p(self, t):
		return struct.pack(PACK_STR,
			t['seconds'],
			t['lat'],
			t['lon'],
			t['speed'],
			t['course'],
			t['vout'],
			t['vin'],
			t['sats'],
			t['fsource'],
			0, 0, 0#,  0, 0, 0, 0, 0, 0, 0	# Reserve
		)

	def get_item(self, offset):
		return self.u_to_v(struct.unpack_from(PACK_STR, self.bin, offset * PACK_LEN))

	def get_first(self):
		return self.get_item(0)

	def get_last(self):
		#return self.get_item(self.count-1)
		return self.u_to_v(struct.unpack_from(PACK_STR, self.bin, (self.count-1) * PACK_LEN))

	def get_all(self, reverse=False):
		if reverse:
			start = len(self.bin) - PACK_LEN	# Я несколько не уверен на счет правильности
			stop = -1
			step = -PACK_LEN
		else:
			start = 0
			stop = len(self.bin)
			step = PACK_LEN

		for offset in xrange(start, stop, step):
			yield self.u_to_v(struct.unpack_from(PACK_STR, self.bin, offset))

	def timelist(self):
		stop = len(self.bin)
		for offset in xrange(0, stop, PACK_LEN):
			yield struct.unpack_from('i', self.bin, offset)[0]

	def time(self, index):
		return struct.unpack_from('i', self.bin, index * PACK_LEN)[0]

	def find_item_index(self, t):
		lo = 0
		hi = self.count
		while lo < hi:
			mid = (lo+hi)//2
			if self.time(mid) < t: lo = mid+1
			else: hi = mid
		return lo

	def test_4_sort(self):
		logging.info('-------- Test 4 sort TBD --------------')
		return True
	
	def add_point(self, point):
		#logging.info('--------  add_point --------------')
		if self.count == 0:
			self.bin = self.v_to_p(point)
			self.i_count = 1
			return True

		t = point['seconds']

		# Как правило данные поступают последовательно и нет смысла искать место вставки, просто нужно добавить данные в конец
		
		if t > self.time(self.count-1):
			self.bin += self.v_to_p(point)
			self.i_count += 1
			return True

		#if t in self.timelist():	# Это не очень оптимальная процедура (возможно стоит ее совместить с поиском)
		#	return False

		# Поиск места вставки
		
		# Версия №2. Вроде работает.


		lo = self.find_item_index(t)

		#if lo < self.count:
		if self.time(lo) == t:		# Элемент уже есть в базе (игнорируем)
			return False

		self.bin = self.bin[:lo*PACK_LEN] + self.v_to_p(point) + self.bin[lo*PACK_LEN:]

		#self.test_4_sort()
		
		self.i_count += 1
		return True

	def get_item_by_dt(self, pdt):
		#t = (pdt.hour & 7)*60*60 + pdt.minute * 60 + pdt.second
		t = pdt.hour*60*60 + pdt.minute*60 + pdt.second
		return self.get_item(self.find_item_index(t))

	@classmethod
	def key_by_date(cls, pdate):
		#return pdate.strftime("%Y%m%d") + "%02d" % (pdate.hour & ~7)
		return pdate.strftime("%Y%m%d")

	@classmethod
	def get_by_date(cls, skey, pdate):
		return cls.get_by_key_name(cls.key_by_date(pdate), parent=skey)

	@classmethod
	def get_by_datetime(cls, skey, dtpoint):
		#return cls.get_by_key_name(cls.key_by_date(pdate), parent=skey)
		#dtpoint = local.toUTC(datetime.strptime(self.request.get("point"), "%d%m%Y%H%M%S"))
		pointr = cls.get_by_date(skey, dtpoint)
		if pointr:
			point = pointr.get_item_by_dt(dtpoint)
			return point
		else:
			return None

	@classmethod
	def get_items_by_range(cls, skey, dtfrom, dtto, maxp):
		#dhfrom = datetime(dtfrom.year, dtfrom.month, dtfrom.day, dtfrom.hour & ~7, 0, 0)
		dhfrom = datetime(dtfrom.year, dtfrom.month, dtfrom.day, 0, 0, 0)
		#dhto = datetime(dtto.year, dtto.month, dtto.day, dtto.hour & ~7, 0, 0)
		dhto = datetime(dtto.year, dtto.month, dtto.day, 0, 0, 0)
		recs = DBGeo.all().ancestor(skey).filter("date >=", dhfrom).filter("date <=", dhto).order("date")#.fetch(1000)
		for rec in recs:
			logging.info('==> API:GEO:GET  fetch DBGeo[%s]' % rec.key().name())
			if maxp == 0: break
			for point in rec.get_all():
				if point['time'] < dtfrom:	# Это очень не оптимально, нужно заменить поиском (TBD)
					continue
				if point['time'] > dtto:
					break

				if maxp == 0: break
				else: maxp -= 1

				yield point
	@classmethod
	def get_tail_items(cls, system_key, count=1):
		recs = DBGeo.all().ancestor(system_key).order("-date")
		prev = None
		antiloop = 1000
		for rec in recs:
			for i in range(rec.count-1, -1, -1):
				antiloop -= 1
				if antiloop<=0: return

				item = rec.get_item(i)
				if prev == (item['lat'], item['lon']): continue
				prev = (item['lat'], item['lon'])
				#logging.info('Get_Tail_Items: Lat = %f  Lon = %f' % prev)
				yield item
				count -= 1
				if count<=0: return

	# Подсчитывает общее количество точек в базе
	@classmethod
	def get_items_count(cls, system_key, maxp = 1000):
		recs = DBGeo.all().ancestor(system_key).order("-date")
		count = 0
		rcount = 0
		for rec in recs:
			count += rec.count
			rcount += 1
		return {'points': count, 'records': rcount}

	# Удаляет все записи до указанной даты
	@classmethod
	def DeleteTo(cls, skey, dtto):
		db.delete(DBGeo.all(keys_only=True).filter('date <', dtto).order('date').ancestor(skey).fetch(200))	# Максимум 200 записей (дней) за раз

"""
	TBD! Необходимо реализовать асинхронное чтение из базы и совместить с предварительным разбором пакета.
"""
class PointWorker(object):
	def __init__(self, skey):
		logging.info('PointWorker: __init__(%s)' % str(skey))
		self.last_pkey = None
		self.rec = None
		self.rec_changed = False
		self.system_key = skey
		self.nrecs = 0

	def Add_point(self, point):
		if point is None: return
		#h = point['time'].hour & ~7;
		#pkey = point['time'].strftime("geo_%Y%m%d") + "%02d" % (point['time'].hour & ~7)
		pkey = DBGeo.key_by_date(point['time'])
		#logging.info('PointWorker: Add_point(%s)' % pkey)
		if pkey != self.last_pkey:
			if self.last_pkey is not None:
				self.Flush()
			self.last_pkey = pkey
			self.rec = DBGeo.get_by_key_name(pkey, parent=self.system_key)
			if self.rec is None:
				self.rec = DBGeo(
					parent = self.system_key,
					key_name = pkey,
					#date = datetime(point['time'].year, point['time'].month, point['time'].day, point['time'].hour & ~7, 0, 0)
					date = datetime(point['time'].year, point['time'].month, point['time'].day, 0, 0, 0)
				)
				self.nrecs = 0
			else:
				self.nrecs = self.rec.count

		#point['seconds'] = point['time'].minute * 60 + point['time'].second
		#point['seconds'] = (point['time'].hour & 7)*60*60 + point['time'].minute * 60 + point['time'].second
		point['seconds'] = point['time'].hour*60*60 + point['time'].minute*60 + point['time'].second

		change = self.rec.add_point(point)
		if change:
			self.nrecs += 1
			self.rec_changed = True

	def Flush(self):
		logging.info('PointWorker: Flush (%d recs)' % self.nrecs)
		if (self.rec is not None) and self.rec_changed:
			self.rec.put()
		self.rec = None
		self.rec_changed = False
		self.nrecs = 0

	def __del__(self):
		self.Flush()

""" Сохранение последних известных координат объектов """

"""
	Разработка нового механизма.
	Создать базу для сохранения последнего положения каждого объекта:
	DBLastPos(key_name=imei, parent=collect):
		timestamp
		position

	(!) запись значения производить один раз на пакет полученных данных.
	с записью дополнительно создается memcache('DBLastPos:imei') содержащая копию данных.
"""

"""
	Запрашивает последнее известное положение объекта skey
	TBD! Необходимо переделать функцию. Не очень удачно запрашивается последнее положение при каждом изменении положения объектов.
"""
'''
def getGeoLast(skey):
	from google.appengine.api import memcache
	imei = skey.name()
	value = memcache.get("geoLast:%s" % imei)
	if value is not None:
		return value
	req = DBGeo.all().ancestor(skey).order('-date').get()
	if req is not None:
		point = req.get_last()
		"""
		tail = []
		for it in DBGeo.get_tail_items(skey, count=TAIL_LEN):
			tail.append(repr_short(it))
		"""
		value = {
			'point': repr_middle(point),
			#'tail': tail,
			#'tailformat': ["date", "lat", "lon", "course"],
		}
		memcache.add("geoLast:%s" % imei, value)
		return value
	else:
		return None
'''

"""
	Потенциально процедура может давать исключение при большом количестве систем (если общий результат более 1МБ
"""
def getGeoLast(skeys):
	from google.appengine.api import memcache

	values = memcache.get_multi([str(k) for k in skeys], key_prefix='geoLast:')
	
	for skey in skeys:
		if str(skey) not in values:
			req = DBGeo.all().ancestor(skey).order('-date').get()
			if req is not None:
				point = req.get_last()
				value = {'point': repr_middle(point)}
				memcache.add("geoLast:%s" % skey, value)
				values[str(skey)] = value
			else:
				values[str(skey)] = 0
	return values



"""
	Обновляет последнее известное положение объекта skey и отправляет обновление клиентам если это потребуется.
"""
def updateLasts(skey, point, points):
	from channel import inform
	from google.appengine.api import memcache
	imei = skey.name()
	value = {'key': str(skey), 'skey': str(skey), 'last':{'point': repr_middle(point)}}
	memcache.set("geoLast:%s" % imei, value)
	logging.warning('== geo.updateLasts(%s, %s, %s)' % (skey, repr_middle(point), points))
	inform('geo_change_last', skey, value)

"""
	Измерение расстояния между двумя точками
"""
def distance(p1, p2):
	from math import pi, sin, cos, atan2, sqrt
	R = 6371; # km (change this constant to get miles)
	dLat = (p2['lat']-p1['lat']) * pi / 180.0
	dLon = (p2['lon']-p1['lon']) * pi / 180.0
	a = sin(dLat/2.0) * sin(dLat/2.0) + cos(p1['lat'] * pi / 180.0) * cos(p2['lat'] * pi / 180.0) * sin(dLon/2.0) * sin(dLon/2.0)
	d = R * 2.0 * atan2(sqrt(a), sqrt(1-a))
	#if (d>1) return Math.round(d)+"km";
	#else if (d<=1) return Math.round(d*1000)+"m";
	return d	# Результат в км
