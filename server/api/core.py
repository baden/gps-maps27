# -*- coding: utf-8 -*-

import os
import sys
import logging

import webapp2
import json
from google.appengine.ext import db
from google.appengine.api import users
#from google.appengine.api import urlfetch
from google.appengine.api import memcache
from google.appengine.api.labs import taskqueue

from datamodel import DBAccounts, DBSystem, DBGeo, PointWorker
from datamodel.admin import DBAdmin

from datetime import datetime, timedelta
from webapp2_extras import sessions

API_VERSION = 1.0
SERVER_NAME = os.environ['SERVER_NAME']
MAXPOINTS = 100000

#logging.getLogger().setLevel(logging.DEBUG)
#logging.getLogger().setLevel(logging.WARNING)

API_VERSION = 1.27

class BaseApi(webapp2.RequestHandler):
	requred = ()
	js_pre = ''
	js_post = ''
	def parcer(self):
		return {'answer': 'no', 'reason': 'base api'}

	def dispatch(self):
		# Get a session store for this request.
		self.session_store = sessions.get_store(request=self.request)

		try:
			# Dispatch the request.
			webapp2.RequestHandler.dispatch(self)
		finally:
			# Save all sessions.
			self.session_store.save_sessions(self.response)

	@webapp2.cached_property
	def session(self):
		# Returns a session using the default cookie key.
		return self.session_store.get_session()


	def _parcer(self):
		if 'nologin' not in self.requred:
			self.user = users.get_current_user()
			if self.user is None:
				return {
					"answer": "no",
					"reason": "Required login.",
					'user': {
						'login_url': users.create_login_url('/'),
						'logout_url': users.create_logout_url('/')
					}
				}
			if 'register' in self.requred:
				self.account = DBAccounts.get_by_user(self.user)
				self.akey = self.account.key()
			else:
				self.akey = DBAccounts.key_from_user_id(self.user.user_id())
			if self.akey is None:
				return {
					"answer": "no",
					"reason": "Required register user first (login).",
					'user': {
						'login_url': users.create_login_url('/'),
						'logout_url': users.create_logout_url('/')
					}
				}

		if 'admin' in self.requred:
			if not users.is_current_user_admin():
				return {
					'answer': 'no',
					'result': 'Admin rights required.',
					'user': {
						#'email': user.email(),
						#'nickname': user.nickname(),
						#'id': user.user_id(),
						'login_url': users.create_login_url('/'),
						'logout_url': users.create_logout_url('/'),
						#'admin': users.is_current_user_admin(),
					}
				}

		if (('account' in self.requred) or ('skey' in self.requred)) and ('register' not in self.requred):
			try:
				self.account = DBAccounts.get(self.akey)
			except db.datastore_errors.BadKeyError, e:
				return {
					'answer': 'no',
					'reason': 'account key error',
					'comments': '%s' % e,
					'user': {
						#'email': user.email(),
						#'nickname': user.nickname(),
						#'id': user.user_id(),
						'login_url': users.create_login_url('/'),
						'logout_url': users.create_logout_url('/'),
						#'admin': users.is_current_user_admin(),
					}
				}

			if self.account is None:
				return {
					'answer': 'no',
					'reason': 'account not found',
					'user': {
						#'email': user.email(),
						#'nickname': user.nickname(),
						#'id': user.user_id(),
						'login_url': users.create_login_url('/'),
						'logout_url': users.create_logout_url('/'),
						#'admin': users.is_current_user_admin(),
					}
				}

		if 'skey' in self.requred:
			skey = self.request.get("skey", None)
			#logging.info(skey)
			if skey is None:
				return {'answer': 'no', 'reason': 'skey not defined or None'}
			try:
				self.skey = db.Key(skey)
			except db.datastore_errors.BadKeyError, e:
				return {'answer': 'no', 'reason': 'skey key error', 'comments': '%s' % e}
			if self.skey not in self.account.systems_key:
			#if self.account.has_skey(self.skey):
				return {'answer': 'no', 'reason': 'System skey is not yours.'}

		if 'imei' in self.requred:
			self.imei = self.request.get('imei', None)
			if self.imei is None:
				return {'answer': 'no', 'result': 'imei not defined'}

		'''
			Имитация задержки запроса сервера
		if SERVER_NAME=='localhost':
			from time import sleep
			sleep(3.0)
		'''

		return self.parcer()

	def get(self):
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		#self.response.headers['Access-Control-Allow-Origin'] = '*'
		self.response.write(self.js_pre + json.dumps(self._parcer(), indent=2) + self.js_post + "\r")

	def post(self):
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		self.response.write(self.js_pre + json.dumps(self._parcer(), indent=2) + self.js_post + "\r")

api_start = datetime.utcnow()
concurent = 0
req_counter = 0
class Version(BaseApi):
	requred = ('nologin')
	def parcer(self):
		#from time import sleep
		global concurent, api_start, req_counter
		conc = concurent
		concurent += 1
		#sleep(3.0)
		self.response.headers['Access-Control-Allow-Origin'] = '*'
		self.response.headers['Access-Control-Allow-Methods'] = "GET, POST, OPTIONS"
		#self.response.headers['Access-Control-Max-Age'] = "1728000"
		now = datetime.utcnow()
		work = now - api_start
		req_counter += 1
		info = {
			'pid': os.getpid(),
			'req_counter': req_counter,
			'concurent': conc,
			'api_start': api_start.isoformat(), #.strftime("%Y-%m-%d %H:%M:%S"),
			'resp_time': now.isoformat(),
			'worktime': work.seconds,
			'environment': dict([(str(k),str(v)) for k,v in os.environ.items()]),
			'headers': dict([(str(k), str(v)) for k,v in self.request.headers.items()]),
		}
		concurent -= 1
		return {'answer': 'ok', 'version': API_VERSION, 'info': info}

class ApiPage(webapp2.RequestHandler):
	def get(self):
		a = {'a': 1, 'b': 3}
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		self.response.write(json.dumps(a, indent=2) + "\r")

info_counter = 0

class Info(BaseApi):
	requred = ('account', 'register')
	js_pre = 'console.log("initconfig.js");\rconfig = $.extend(config, '
	js_post = ');\r'
	def parcer(self, **argw):
		from datamodel.geo import getGeoLast
		from datamodel.accounts import DBDomain

		global info_counter
		info_counter += 1

		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		#user = users.get_current_user()
		#test_value = self.session.get('test-value')
		#if test_value:
		#	pass
		#else:
		#	self.session['test-value'] = 1
		"""
		if user is None:
			return {
				'answer': 'no',
				'reason': 'Required login.',
				'user': {
					#'email': user.email(),
					#'nickname': user.nickname(),
					#'id': user.user_id(),
					'login_url': users.create_login_url('/'),
					'logout_url': users.create_logout_url('/'),
					#'admin': users.is_current_user_admin(),
				}
			}
		account = DBAccounts.get_by_user(user)
		
		if account is None:
			return {
				'answer': 'no',
				'reason': 'Required login.',
				'user': {
					'email': user.email(),
					'nickname': user.nickname(),
					'id': user.user_id(),
					'login_url': users.create_login_url('/'),
					'logout_url': users.create_logout_url('/'),
					'admin': users.is_current_user_admin(),
				}
			}
		"""
		"""
			Так как эта процедура может занимать много времени, то сделаем это асинхронно
			Хотя все равно уже на 80 системах это занимает около секунды. Не хотется думать что будет при тысяче систем.
		"""
		systems_rpc = self.account.systems_async
		lasts = getGeoLast(self.account.systems_key)

		login_url = users.create_login_url('/')
		logout_url = users.create_logout_url('/')

		#systems = [sys.todict() for sys in systems_rpc.get_result()]

		syss = systems_rpc.get_result()
		#systems = [sys.todict() for sys in syss]
		systems = dict([(str(sys.key()), sys.todict()) for sys in syss])
		sys_keys = [str(s.key()) for s in syss]

		#for s in systems:
		#	s['last'] = lasts[s['key']]
		for k,v in systems.items():
			v['last'] = lasts[str(k)]

		domain = DBDomain.get()
		if domain is None:
			domain = DBDomain.set()

		self.session['run_counter'] = int(self.session.get('run_counter', '0')) + 1

		return {
			'version': API_VERSION,
			'session': {
				#'test_value': test_value,
				'info_counter': info_counter,
				'run_counter': self.session['run_counter'],
				'pid': os.getpid(),
			},
			'server_name': os.environ['SERVER_NAME'],
			'domain': domain.todict(),
			'account': {
				'key': str(self.account.key()),
				'user': {
					'email': self.user.email(),
					'nickname': self.user.nickname(),
					'id': self.user.user_id(),
					'login_url': login_url,
					'logout_url': logout_url,
					'admin': users.is_current_user_admin(),
				},
				'config': self.account.pconfig,
				'name': self.account.name,
				'systems': systems,
				'sys_keys': sys_keys
			}
		}

		"""
		lsys = [{
				"key": str(sys.key()),
				"skey": str(sys.key()),
				"imei": sys.imei,
				"phone": sys.phone,
				"desc": sys.desc,
				"premium": sys.premium >= datetime.utcnow(),
			} for sys in self.account.systems]
		accinfos = {
			'key': "%s" % self.account.key(),
			'config': self.account.pconfig,
			'name': self.account.name,
			'user': {
				'email': self.account.user.email(),
				'nickname': self.account.user.nickname(),
				'id': self.account.user.user_id(),
				'login_url': users.create_login_url('/'),
				'logout_url': users.create_logout_url('/'),
				'admin': users.is_current_user_admin(),
			},
			'systems': lsys,
		}

		return {
			'answer': 'ok',
			'info': {
				'version': API_VERSION,
				'server_name': os.environ['SERVER_NAME'],
				'account': accinfos,
				#'systems': sysinfos,
			}
		}
		"""


# --------------------------------------------------------------------------------

class Debug_jqGrid(webapp2.RequestHandler):
	def get(self):
		g_rows = int(self.request.get("rows", "1"))
		g_page = int(self.request.get("page", "1"))
		#g_sort = self.request.get("sidx", "dt"))
		#g_sort_order = self.request.get("sord", "asc"))
		g_search = self.request.get("_search", "false")
		g_nd = long(self.request.get("nd", "0"))
		
		rows = [];
		for i in xrange(g_rows):
			rows.append({
				"id": i,
				"cell": [
					datetime.utcnow().strftime("%Y-%b-%d  %H:%M:%S GMT"),	# dt
					i+(g_page-1)*g_rows,	# la
					i+1,			# lo
					i+2,			# sp
				],
			})
		jsonresp = {
			"page": g_page,
			"total": 1000,
			"record": 13,
			"records": 12269,
			"rows": rows,
			"userdata": {
				"tamount": 100,
				"ttax": 200,
				"ttotal": 300,
			}
		}
		
		self.response.out.write(json.dumps(jsonresp) + "\r")

# TBD!!! В этой процедуре утечка памяти!!! И очень быстрая
# Отказ от json не помогает

class GetGeo(webapp2.RequestHandler):
	def get(self):
		skey = self.request.get("skey")
		if skey:
			system_key = db.Key(skey)

		recs = DBGeo.all().ancestor(system_key).order("date").fetch(100)

		g_rows = int(self.request.get("rows", "1"))
		g_page = int(self.request.get("page", "1"))
		#logging.info(g_rows)

		total = 0
		skip = (g_page-1) * g_rows
		isid = skip
		goted = 0

		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		#rows = [];					# json
		self.response.out.write('{"rows":[\n ')		# ! json

		first = True

		for rec in recs:
			#bdate = datetime(rec.date.

			"""
			# Сортируем список timelist
			# Правильнее делать это на этапе получений точки! TBD!!!
			sindex = sorted([(item, index) for index, item in enumerate(rec.timelist)])
			"""
			lsindex = rec.count
			#logging.info("\n==  Before: %s\n== After: %s" % (repr(rec.timelist), repr(sindex)))

			for p in xrange(lsindex):
				total = total + 1

				# json
				#if len(rows) >= g_rows: continue

				# !json
				if goted >= g_rows: continue

				if skip > 0:
					skip = skip - 1
					continue

				#p = sindex[i][1]	# Получаем индекс из отсортированого списка

				# Если бы не необходимость пропускать значения, то можно было бы воспользоваться
				# итератором
				#  for u in rec.get_all():

				goted += 1
				r = rec.get_item(p)

				# json
				"""
				rows.append({
					"id": isid,
					"cell": [
						r['time'].strftime("%Y-%m-%d %H:%M:%S"),	# dt
						#ptime.strftime("%Y-%m-%d"),	# dt
						r['lat'],
						r['lon'],
						r['sats'],
						r['speed'],
						r['course'],
						r['vout'],
						r['vin'],
						r['fsource'],
						#rec.extend[p]
						"%d" % total
					],
				})
				"""

				# ! json
				if first:
					first = False
				else:
					self.response.out.write(',\n ')
				self.response.out.write('{"id": %d, "cell": ["%s", %f, %f, %d, %f, %f, %f, %f, %d, "%s"]}' % (
					isid,
					r['time'].strftime("%Y-%m-%d %H:%M:%S"),	# dt
					#ptime.strftime("%Y-%m-%d"),	# dt
					r['lat'],
					r['lon'],
					r['sats'],
					r['speed'],
					r['course'],
					r['vout'],
					r['vin'],
					r['fsource'],
					r['fsourcestr'],
					#rec.extend[p]
					#str(total)
				))

				isid = isid + 1

		# json
		"""
		jsonresp = {
			"page": g_page,
			"total": int((total + g_rows - 1) / g_rows),
			"record": 13,
			"records": total,
			"rows": rows,
			"userdata": {
				"tamount": 1000,
				"g_rows": g_rows,
				"hours": len(recs),
				"total": total,
				"goted": len(rows),
			}
		}
		"""

		# ! json
		self.response.out.write('\n],\n "page": %d, "total": %d, "record": %d, "records": %d,\n "userdata": {"tamount": %d, "g_rows": %d, "hours": %d, "total": %d, "goted": %d}}' % (
			g_page,
			int((total + g_rows - 1) / g_rows),
			13,
			total,
			1000,
			g_rows,
			len(recs),
			total,
			goted
		))

		# json
		#self.response.out.write(json.dumps(jsonresp) + "\r")
		#rows = None
		#jsonresp = None

def put_random_point(worker):
	import random
	# Подготовим точку
	#datetime.utcnow()
	#ptime = datetime.today() + timedelta(seconds = random.randint(0, 86400-1))
	ptime = datetime.today() + timedelta(seconds = random.randint(0, 3600-1))
	lat = random.uniform(-90.0, 90.0)
	lon = random.uniform(-180.0,180.0)
	sats = random.randint(0,255)
	speed = random.uniform(0.0, 260.0)
	course = random.uniform(0.0, 360.0)
	vout = random.uniform(0.0, 36.0)
	vin = random.uniform(0.0, 6.0)
	fsource = random.randint(0, 255)

	#worker.Add_point(ptime, lat, lon, sats, speed, course, vout, vin, fsource)
	worker.Add_point({
		'time': ptime,
		'lat': lat,
		'lon': lon,
		'sats': sats,
		'speed': speed,
		'course': course,
		'vout': vout,
		'vin': vin,
		'fsource': fsource
	})

def put_seq_point(worker, start, offset):
	import random
	# Подготовим точку
	#datetime.utcnow()
	#ptime = datetime.today() + timedelta(seconds = random.randint(0, 86400-1))
	ptime = start + timedelta(seconds = offset)
	lat = random.uniform(-90.0, 90.0)
	lon = random.uniform(-180.0,180.0)
	sats = random.randint(0,255)
	speed = random.uniform(0.0, 260.0)
	course = random.uniform(0.0, 360.0)
	vout = random.uniform(0.0, 36.0)
	vin = random.uniform(0.0, 6.0)
	fsource = random.randint(0, 255)

	worker.Add_point({
		'time': ptime,
		'lat': lat,
		'lon': lon,
		'sats': sats,
		'speed': speed,
		'course': course,
		'vout': vout,
		'vin': vin,
		'fsource': fsource
	})


class DebugGeo(webapp2.RequestHandler):
	def post(self):
		import random

		skey = self.request.get("skey")
		if skey:
			system_key = db.Key(skey)
		else:
			self.response.out.write("ERROR: not a skey.")
			return

		g_cnt = int(self.request.get("cnt", "1"))

		worker = PointWorker(system_key)

		for i in xrange(g_cnt):
			put_random_point(worker)

		"""
		start = datetime.today() + timedelta(seconds = random.randint(0, 86400-1))

		for i in xrange(g_cnt):
			put_seq_point(worker, start, i)
		"""

		#worker.Flush()
		del worker

		self.response.out.write("OK")

"""
class Global_DelAll(BaseApi):
	def parcer(self, **argw):
		geos = DBGeo.all(keys_only=True).fetch(1000)
		db.delete(geos)
		return {'answer': 'ok'}
"""

#class Chanel_GetToken(BaseApi):
#	requred = ('account')
#	def parcer(self):
#		#import updater
#
#		uuid = self.request.get("uuid")
#		if uuid is None:
#			return {'answer': 'no', 'reason': 'uuid not defined or None'};
#
#		token = updater.register(self.account, uuid)
#
#		logging.info('== Goted token %s ' % token)
#
#		return {
#			'answer': 'ok',
#			'akey': '%s' % self.account.key(),
#			'uuid': uuid,
#			'token': token
#		}


country = 'ua'
#device = 'Sony_Ericsson-K750'
device = "Nokia N95 8Gb"
user_agent = 'Mozilla/4.0 (compatible; MSIE 5.5; Windows NT)'
mmap_url = 'http://www.google.com/glm/mmap'
geo_url = 'http://maps.google.com/maps/geo'

from struct import pack, unpack
from httplib import HTTP
import urllib2

def fetch_latlong_http(query):
    http = HTTP('www.google.com', 80)
    http.putrequest('POST', '/glm/mmap')
    http.putheader('Content-Type', 'application/binary')
    http.putheader('Content-Length', str(len(query)))
    http.endheaders()
    http.send(query)
    code, msg, headers = http.getreply()
    result = http.file.read()
    return result

def fetch_latlong_urllib(query):
    headers = { 'User-Agent' : user_agent }
    req = urllib2.Request(mmap_url, query, headers)
    resp = urllib2.urlopen(req)
    response = resp.read()
    return response

fetch_latlong = fetch_latlong_http
def get_location_by_cell(cid, lac, mnc=0, mcc=0, country='ua'):
    b_string = pack('>hqh2sh13sh5sh3sBiiihiiiiii',
                    21, 0,
                    len(country), country,
                    len(device), device,
                    len('1.3.1'), "1.3.1",
                    len('Web'), "Web",
                    27, 0, 0,
                    3, 0, cid, lac,
                    0, 0, 0, 0)

    bytes = fetch_latlong(b_string)
    (a, b,errorCode, latitude, longitude, c, d, e) = unpack(">hBiiiiih",bytes)
    latitude = latitude / 1000000.0
    longitude = longitude / 1000000.0

    return latitude, longitude

def get_location_by_geo(latitude, longitude):
    url = '%s?q=%s,%s&output=json&oe=utf8' % (geo_url, str(latitude), str(longitude))
    return urllib2.urlopen(url).read()

class GMapCeng(BaseApi):
	#requred = ('account')
	def parcer(self):
		ceng = self.request.get("ceng", '')

		el = ceng[1:-1].split(',')
		info = {
			'arfcn': int(el[0], 16),
			'rxl': el[1],
			'rxq': el[2],
			'mcc': el[3],
			'mnc': el[4],
			'bsic': el[5],
			'cid': int(el[6], 16),
			'rla': el[7],
			'txp': el[8],
			'lac': int(el[9], 16),
			'TA': el[10]
		}

		loc = get_location_by_cell(info['cid'], info['lac'], info['mnc'], info['mcc'])

		return {'answer': 'ok', 'ceng': ceng, 'el': el, 'info': info, 'loc': loc, 'geo': get_location_by_geo(loc[0],loc[1])}


class Admin_Operations(BaseApi):
	requred = ('admin')
	def parcer(self):
		cursor = self.request.get("cursor", None)
		if cursor is None:
			q = DBAdmin.lastOperations()
		else:
			q = DBAdmin.lastOperations(cursor=cursor)
		ans = []
		for r in q.fetch(20):
			ans.append({
				'time': r.date.strftime("%y%m%d%H%M%S"),
				'desc': r.desc,
				'account': db.get(r.akey).user.nickname(),
				'params': eval(r.params)
			})

		return {'answer': 'ok', 'operations': ans, 'cursor': q.cursor()}

class Sys_Misc_Drivers(BaseApi):
	def parcer(self):
		info = {}
		return {'answer': 'ok', 'info': info}
