# -*- coding: utf-8 -*-

"""
 Я вот подумал отказаться от разделения bingps на прием и анализ.
 А то очередь выполняется только раз в секунду, и поэтому при активном трафике "parse" занимает
 много времени (если я правильно понимаю при поступлении чаще чем раз в секунду очередь будет расти бесконечно).
"""

import os
import webapp2
import logging
from google.appengine.ext import db
from google.appengine.api import memcache
from zlib import compress, decompress
import cPickle as pickle
#from libs import deferred

from utils import CRC16

USE_TASK_DATA = True
USE_BACKUP = False
IMEI_BLACK_LIST = ('000')
SERVER_NAME = os.environ['SERVER_NAME']

glogal_counter = 0

logging.getLogger().setLevel(logging.WARNING)

class DBGPSBin(db.Model):
	dataid = db.IntegerProperty()
	data = db.BlobProperty()		# Пакет данных (размер ориентировочно до 64кбайт)

class DBGPSBinBackup(db.Model):
	cdate = db.DateTimeProperty(auto_now_add=True)
	dataid = db.IntegerProperty()
	crcok = db.BooleanProperty(default=False)
	data = db.BlobProperty()		# Пакет данных (размер ориентировочно до 64кбайт)

def SaveGPSPointFromBin(pdata, result):
	from datetime import datetime, timedelta

	def LogError():
		sstr = "==  pdata: "
		for p in pdata:
			sstr += " %02X" % ord(p)
		#sstr += "\nEncode partial data:\n\tdate:%s\n\tLatitude:%f\n\tLongitude:%f\n\tSatelites:%d\n\tSpeed:%f\n\tCource:%f\n\tAltitude:%f" % (datestamp, latitude, longitude, sats, speed, course, altitude)
		logging.error( sstr )

	#global jit_lat
	#global jit_long

	if ord(pdata[0]) != 0xF2:	# ID
		logging.error("\n==\t GPS_PARSE_ERROR: ID != 0xF2")
		return None
	if ord(pdata[1]) != 0x20:
		logging.error("\n==\t GPS_PARSE_ERROR: LENGTH != 0x20")
		return None	# LENGTH

	day = ord(pdata[2])
	month = ord(pdata[3]) & 0x0F
	year = (ord(pdata[3]) & 0xF0)/16 + 2010
	hours = ord(pdata[4])
	minutes = ord(pdata[5])
	seconds = ord(pdata[6])

	"""
	if day<1 or day>31:
		logging.error("\n==\t GPS_PARSE_ERROR: DAY=%d" % day)
		return None	# LENGTH
	if month<1 or month>12:
		logging.error("\n==\t GPS_PARSE_ERROR: MONTH=%d" % month)
		return None	# LENGTH
	if year<2010 or year>2014:
		logging.error("\n==\t GPS_PARSE_ERROR: YEAR=%d" % year)
		return None	# LENGTH
	"""

	try:
		datestamp = datetime(year, month, day, hours, minutes, seconds)
	except ValueError, strerror:
		logging.error("\n==\t GPS_PARSE_ERROR: error datetime (%s)" % strerror)
		LogError()
		return None	# LENGTH

	if datestamp > datetime.now() + timedelta(days=1):
		logging.error("\n==\t GPS_PARSE_ERROR: error datetime: future point")
		return None

	latitude = float(ord(pdata[7])) + (float(ord(pdata[8])) + float(ord(pdata[9])*100 + ord(pdata[10]))/10000.0)/60.0
	longitude = float(ord(pdata[11])) + (float(ord(pdata[12])) + float(ord(pdata[13])*100 + ord(pdata[14]))/10000.0)/60.0
	if ord(pdata[15]) & 1:
		latitude = - latitude
	if ord(pdata[15]) & 2:
		longitude = - longitude

	sats = ord(pdata[16])

	fix = 1
	speed = (float(ord(pdata[17])) + float(ord(pdata[18])) / 100.0) * 1.852 # Переведем в км/ч

	if ord(pdata[15]) & 4:
		course = float(ord(pdata[19])*2 + 1) + float(ord(pdata[20])) / 100.0
	else:
		course = float(ord(pdata[19])*2) + float(ord(pdata[20])) / 100.0;

	altitude = 0.0	#100.0 * float(ord(pdata[21]) + ord(pdata[22])) / 10.0;

	error = False

	if latitude > 90.0: error = True
	if latitude < -90.0: error = True
	if longitude > 180.0: error = True
	if longitude < -180.0: error = True

	if SERVER_NAME=='localhost':
		#jit_lat = jit_lat + (random.random()-0.5)*0.001
		#jit_long = jit_long + (random.random()-0.5)*0.001
		#latitude = latitude + jit_lat
		#longitude = longitude + jit_long
		pass

	if error:
		logging.error("Corrupt latitude or longitude %f, %f" % (latitude, longitude))
		LogError()
		"""
		sstr = "  pdata: "
		for p in pdata:
			sstr += " %02X" % ord(p)
		sstr += "\nEncode partial data:\n\tdate:%s\n\tLatitude:%f\n\tLongitude:%f\n\tSatelites:%d\n\tSpeed:%f\n\tCource:%f\n\tAltitude:%f" % (datestamp, latitude, longitude, sats, speed, course, altitude)
		logging.error( sstr )
		"""
		return None

	if sats < 3:
		logging.error("No sats.")
		LogError()
		return None

	#in1 = float(self.request.get('in1'))*100.0/65535 
	#in2 = float(self.request.get('in2'))*100.0/65535 
	in1 = 0.0
	in2 = 0.0
	if (ord(pdata[23]) == 0) and (ord(pdata[24]) == 0):
		vout = float(ord(pdata[21])) / 10.0
		vin = float(ord(pdata[22])) / 50.0
	else:
		vout = float(ord(pdata[21]) + 256*ord(pdata[22])) / 100.0
		vin = float(ord(pdata[23]) + 256*ord(pdata[24])) / 100.0

	fsource = ord(pdata[26]);	# Причина фиксации координаты

	#_log += '\n Date: %s' % datestamp.strftime("%d/%m/%Y %H:%M:%S")
	#_log += '\n Latitude: %.5f' % latitude
	#_log += '\n Longitude: %.5f' % longitude
	#_log += '\n Satelits: %d' % sats
	#_log += '\n Speed: %.5f' % speed
	#_log += '\n Course: %.5f' % course
	#_log += '\n Altitude: %.5f' % altitude
	#logging.info('[%s]' % datestamp.strftime("%d/%m/%Y %H:%M:%S"))

	#gpspoint = datamodel.DBGPSPoint()
	"""
	gpspoint = datamodel.DBGPSPoint(key_name = "gps_%s_%s" % (result.user.imei, datestamp.strftime("%Y%m%d%H%M%S")))
	#gpspoint = datamodel.DBGPSPoint()
	gpspoint.user = result.user
	gpspoint.date = datestamp
	gpspoint.latitude = latitude
	gpspoint.longitude = longitude
	gpspoint.sats = sats
	gpspoint.fix = fix
	gpspoint.speed = speed
	gpspoint.course = course
	gpspoint.altitude = altitude
	gpspoint.vout = vout
	gpspoint.vin = vin
	gpspoint.in1 = in1
	gpspoint.in2 = in2
	gpspoint.fsource = fsource
	"""

	"""
	from local import fromUTC

	point = {
		'time': '%s' % fromUTC(datestamp).strftime("%d/%m/%Y %H:%M:%S"),
		'lat': '%.4f' % latitude,
		'lon': '%.4f' % longitude,
	}
	LogError()
	logging.info('POINT: %s' % repr(point))
	"""

	return {
		'time': datestamp,
		'lat': latitude,
		'lon': longitude,
		'sats': sats,
		'speed': speed,
		'course': course,
		'vout': vout,
		'vin': vin,
		'fsource': fsource 
	}
'''
class BinGpsParse(webapp2.RequestHandler):
	def post(self):
		from datamodel.geo import PointWorker, updateLasts

		logging.info("arguments: %s" % self.request.arguments())
		logging.info("body: %s" % len(self.request.body))
		#return

		_log = "\n== BINGPSPARSE ["

		pdata = None
		skey = None
		result = None
		crc = 0
		key = None
		point = None	# Тут будет последняя добавленная точка

		payload = pickle.loads(decompress(self.request.body))
		#logging.info('payload: %s' % repr(payload))
		skey = db.Key(payload['skey'])
		crc = payload['crc']

		if 'key' not in payload:
			#payload = pickle.loads(decompress(self.request.body))
			pdata = payload['pdata']
		else:
			key = db.Key(payload['key'])
			pdata = memcache.get("DBGPSBin:%s" % key)
			if pdata is None:
				logging.warning('!!! Fail caching data by memcache! Using datastore.')
				result = DBGPSBin.get(key)
				if result:
					pdata = result.data

		if pdata is not None:
			plen = len(pdata)
			_log += '\n==\tDATA LENGHT: %d' % plen

			crc2 = 0
			for byte in pdata:
				crc2 = CRC16(crc2, ord(byte))

			if crc == crc2:
				_log += '\nCRC: OK (%04X)' % crc
			else:
				_err = '\nCRC: ERROR!\n==\tpdata size: %d' % plen
				_err+= '\n==\tpdata: '
				for data in pdata:
					_err += ' %02X' % ord(data)
				logging.error(_err)
				return

			worker = PointWorker(skey)

			offset = 0
			points = 0
			lasttime = None

			while offset < plen:
				if pdata[offset] != '\xFF':
					offset += 1
					continue

				#logging.warning(pdata[offset:offset+32].encode('hex'))

				#try:
				if True:
					p_id = ord(pdata[offset+1])	# Идентификатор пакета
					p_len = ord(pdata[offset+2])	# Длина пакета в байтах

					if p_id == 0xF2:
						point = SaveGPSPointFromBin(pdata[offset+1:offset+1+32], result)
						if point:
							if (lasttime is not None) and (point['time'] < lasttime):
								_log += '\n Time must always grow or repeat - ignored'
							else:
								lasttime = point['time']
								worker.Add_point(point)
								points += 1
					else:
						_log += '\n Unknown id=%02X' % p_id
					offset += p_len
				#except:
				else:
					_warn = '\n Error parce at %d offset' % offset
					_warn += '\n==\tpdata size: %d' % plen
					_warn += '\n==\tpdata: '
					for data in pdata:
						_warn += ' %02X' % ord(data)
					logging.warning(_warn)
					offset += 1

			worker.Flush()

			if points > 0:
				_log += '\n==\tSaved points: %d\n' % points
				updateLasts(skey, point, points)
			else:
				logging.error("Packet has no data or data is corrupted.\n")

			if result is not None:
				result.delete()
			elif key is not None:
				db.delete(key)

			#_log += '\nData deleted.\n'
			_log += '\nOk\n'
			
			self.response.write('BINGPS/PARSE: OK\r\n')
			
		else:
			self.response.write('BINGPS/PARSE: NODATA\r\n')

		logging.info(_log)
'''
#def parce_gps(skey):
#	logging.info('CALL parcer')
#	pass
"""
	TBD! Необходимо обработчик обернуть в try: except: чтобы не возвращать приборам мусор с случае исключений.
"""
class BinGps(webapp2.RequestHandler):
	def post(self):
		global glogal_counter
		import os
		from datamodel.system import DBSystem
		#from google.appengine.api.labs import taskqueue
		from datetime import datetime
		from datamodel.geo import PointWorker, updateLasts

		os.environ['CONTENT_TYPE'] = "application/octet-stream"		# Патч чтобы SIMCOM мог слать сырые бинарные данные

		self.response.headers['Content-Type'] = 'application/octet-stream'	# А это чтобы ответ не чанковался

		logging.info("arguments: %s" % self.request.arguments())
		logging.info("body: %s" % len(self.request.body))

		glogal_counter = glogal_counter + 1
		_log = "\n== BINGPS(%d) [" % glogal_counter

		imei = self.request.get('imei', '000000000000000')

		"""
		# TBD! Реализовать проверку премиум-аккаунтов. Естественно с кэшированием.
		block_bingps = memcache.get("block_bingps:%s" % imei)
		if block_bingps is not None:
			logging.warning("IMEI block by DOS. Denied.")
			self.response.out.write('BINGPS: TIMEIN\r\n')
			return
		memcache.set("block_bingps:%s" % imei, '*', time = 60*1)
		"""

		if imei in IMEI_BLACK_LIST:
			logging.error("IMEI in black list. Denied.")
			self.response.write('BINGPS: DENIED\r\n')
			return

		#skey = DBSystem.getkey_or_create(imei)
		skey = DBSystem.key_by_imei(imei)
		#logging.warning("system key: %s" % str(skey))

		dataid = int(self.request.get('dataid', '0'), 16)
		pdata = ''
		if 'Content-Type' in self.request.headers:
			if self.request.headers['Content-Type'] == 'application/x-www-form-urlencoded':
				pdata = unquote_plus(self.request.body)
			else:
				pdata = self.request.body

		_log += '\n==\tData ID: %d' % dataid
		_log += '\n==\tBody size: %d' % len(pdata)

		if len(pdata) < 3:
			logging.error('Data packet is too small or miss.')
			self.response.write('BINGPS: CRCERROR\r\n')
			return

		crc = ord(pdata[-1])*256 + ord(pdata[-2])
		pdata = pdata[:-2]
		_log += '\n==\tData size: %d' % len(pdata)

		crc2 = 0
		for byte in pdata:
			crc2 = CRC16(crc2, ord(byte))

		if USE_BACKUP:
			_log += '\nSaving to backup'
			newbinb = DBGPSBinBackup(parent = skey)
			newbinb.dataid = dataid
			newbinb.data = pdata
		
			if crc!=crc2:
				newbinb.crcok = False
			else:
				newbinb.crcok = True
			newbinb.put()

		if crc!=crc2:
			_log += '\n==\tWarning! Calculated CRC: 0x%04X but system say CRC: 0x%04X. (Now error ignored.)' % (crc2, crc)
			_log += '\n==\t\tData (HEX):'
			for data in pdata:
				_log += ' %02X' % ord(data)
			logging.info(_log)
			self.response.write('BINGPS: CRCERROR\r\n')
			return
		else:
			_log += '\n==\tCRC OK %04X' % crc

		logging.info(_log)

		# ------------------------

		_log = "\n== BINGPSPARSE ["

		key = None
		point = None	# Тут будет последняя добавленная точка

		plen = len(pdata)

		worker = PointWorker(skey)

		offset = 0
		points = 0
		lasttime = None
		result = None

		while offset < plen:
			if pdata[offset] != '\xFF':
				offset += 1
				continue

			#logging.warning(pdata[offset:offset+32].encode('hex'))

			#try:
			if True:
				p_id = ord(pdata[offset+1])	# Идентификатор пакета
				p_len = ord(pdata[offset+2])	# Длина пакета в байтах

				if p_id == 0xF2:
					point = SaveGPSPointFromBin(pdata[offset+1:offset+1+32], result)
					if point:
						if (lasttime is not None) and (point['time'] < lasttime):
							_log += '\n Time must always grow or repeat - ignored'
						else:
							lasttime = point['time']
							worker.Add_point(point)
							points += 1
				else:
					_log += '\n Unknown id=%02X' % p_id
				offset += p_len
			#except:
			else:
				_warn = '\n Error parce at %d offset' % offset
				_warn += '\n==\tpdata size: %d' % plen
				_warn += '\n==\tpdata: '
				for data in pdata:
					_warn += ' %02X' % ord(data)
				logging.warning(_warn)
				offset += 1

		worker.Flush()

		if points > 0:
			_log += '\n==\tSaved points: %d\n' % points
			updateLasts(skey, point, points)
		else:
			logging.error("Packet has no data or data is corrupted.\n")

		if result is not None:
			result.delete()
		elif key is not None:
			db.delete(key)

		#_log += '\nData deleted.\n'
		_log += '\nOk\n'
			
		logging.info(_log)
		
		self.response.write('BINGPS: OK\r\n')

		'''
		_log += '\nCreating tasque'

		# (!TBD!) Это вполне можно переделать на использование google.appengine.ext.deffered, но пока не получается. То задачи не запускаются, то непонятки с отличиями библиотек
		#deferred.defer(parce_gps, "123")
		#logging.info(_log)
		#self.response.write('BINGPS: OK\r\n')
		#return

		no_task_data = False
		if USE_TASK_DATA:
			payload = compress(pickle.dumps({
				'skey': str(skey),
				'crc': crc,
				'pdata': pdata,
			}, protocol=pickle.HIGHEST_PROTOCOL), 9)
			if len(payload) < 10200:
				try:
					taskqueue.add(url='/bingps/parse', method="POST", payload=payload, headers={'Content-Type': 'application/octet-stream'})
				except taskqueue.TaskTooLargeError, e:
					no_task_data = True
					logging.warning("Big packet for task transfer (%s)! Use datastore transfer." % e)
			else:
				no_task_data = True
		else:
			no_task_data = True

		if no_task_data:
			key_name = datetime.now().strftime("%y%m%d%H%M%S")
			#key_name = os.urandom(16).encode('hex')
			newbin = DBGPSBin(key_name = key_name, parent = skey)
			newbin.dataid = dataid
			newbin.data = pdata #db.Text(pdata)
			#db.put_async(newbin)
			newbin.put()

			memcache.set("DBGPSBin:%s" % newbin.key(), pdata, time = 30)
			payload = compress(pickle.dumps({
				'skey': str(skey),
				'crc': crc,
				'key': str(newbin.key())
			}, protocol=pickle.HIGHEST_PROTOCOL), 9)
			taskqueue.add(url='/bingps/parse', method="POST", payload=payload, headers={'Content-Type': 'application/octet-stream'})

		#del payload
		#del pdata
		'''
