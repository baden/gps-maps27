# -*- coding: utf-8 -*-

import webapp2
import logging
import os
import json

from google.appengine.ext import db
from google.appengine.api import users
from webapp2_extras import jinja2
from webapp2_extras import sessions
from webapp2_extras.users import login_required
from datetime import date, timedelta, datetime

from datamodel.accounts import DBAccounts
from datamodel.system import DBSystem
from google.appengine.api import namespace_manager

logging.getLogger().setLevel(logging.WARNING)

SERVER_NAME = os.environ['SERVER_NAME']
VERSION = '0'
if 'CURRENT_VERSION_ID' in os.environ: VERSION = os.environ['CURRENT_VERSION_ID'] + '/2'
"""
class TemplatedPage(RequestHandler):
	def __init__(self):
		self.user = users.get_current_user()
		if self.user == None:
			self.accounts = None
			return

		self.account = DBAccounts.get_by_key_name("acc_%s" % self.user.user_id())

		if self.account is None:
			self.account = DBAccounts(key_name = "acc_%s" % self.user.user_id())
			self.account.user = self.user
			self.account.put()

	def write_template(self, values, alturl=None):
		if self.user:
			#url = users.create_logout_url(self.request.uri)
			login_url = users.create_login_url(self.request.uri)
			values['login_url'] = login_url
			values['now'] = datetime.utcnow()
			values['username'] = self.user.nickname()
			values['admin'] = users.is_current_user_admin()
			values['server_name'] = SERVER_NAME
			values['uid'] = self.user.user_id()
			values['account'] = self.account

			values['environ'] = os.environ
			values['version'] = VERSION

			if alturl:
				path = os.path.join(os.path.dirname(__file__), 'templates', alturl)
			else:
				path = os.path.join(os.path.dirname(__file__), 'templates', self.__class__.__name__ + '.html')
			self.response.write(template.render(path, values))
		else:
			self.redirect(users.create_login_url(self.request.uri))
"""
class BaseHandler(webapp2.RequestHandler):
	@webapp2.cached_property
	def jinja2(self):
		return jinja2.get_jinja2(app=self.app)

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

	def render_template(self, filename, **template_args):
		#namespace_manager.set_namespace(os.environ['SERVER_NAME'])

		user = users.get_current_user()
		#self.account = DBAccounts(key_name = "acc_%s" % self.user.user_id())
		#akey = db.Key.from_path('DBAccounts', user.user_id())
		akey = DBAccounts.key_from_user_id(user.user_id())
		template_args['login_url'] = users.create_login_url(self.request.uri)
		template_args['logout_url'] = users.create_logout_url(self.request.uri)
		template_args['admin'] = users.is_current_user_admin()
		#template_args['server_name'] = SERVER_NAME
		template_args['server_name'] = os.environ['SERVER_NAME']
		template_args['user'] = user

		template_args['environ'] = os.environ
		template_args['version'] = VERSION

		#account = DBAccounts.get(akey)
		#if account is None:
		#	account = DBAccounts(user.user_id(), user=user)
                #account = DBAccounts.get_or_insert(user.user_id(), user=user)
		account = DBAccounts.get_by_user(user)
		template_args['account'] = account
		template_args['akey'] = akey

		# To set a value:
		#self.session['foo'] = 0
		# To get a value:
		#foo = self.session.get('foo')

		self.session['run_counter'] = self.session.get('run_counter', 0) + 1
		logging.info('--------------> Increment session')

		template_args['session'] = self.session

		self.response.write(self.jinja2.render_template(filename, **template_args))


class MainPage(BaseHandler):
	@login_required
	def get(self):
		template_args = {}
		self.render_template(self.__class__.__name__ + '.html', **template_args)

class TestMainPage(BaseHandler):
	@login_required
	def get(self):
		template_args = {}
		self.render_template(self.__class__.__name__ + '.html', **template_args)

class TestMain2(BaseHandler):
	@login_required
	def get(self):
		template_args = {}
		self.render_template(self.__class__.__name__ + '.html', **template_args)


class Appcache(webapp2.RequestHandler):
	def get(self):
		self.response.headers['Content-Type'] = 'text/cache-manifest'
		user = users.get_current_user()
		if user == None:
			user = 'None'
		else:
			user = user.nickname()

		manifest = """CACHE MANIFEST
# AppName: %s
# User: %s
# Version: %s

CACHE:
/stylesheets/all.css
/plugins/jquery-ui-1.8.16/jquery-ui-1.8.16/ui/jquery-ui.js
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/jquery-ui.css
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_72a7cf_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_highlight-hard_100_f2f5f7_1x100.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_highlight-soft_100_deedf7_1x100.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_glass_50_3baae3_1x400.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_ffffff_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_glass_80_d7ebf9_1x400.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_3d80b3_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_2694e8_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_glass_100_e4f1fb_1x400.png
/plugins/jquery-ui-timepicker-0.2.9/jquery.ui.timepicker.js
/plugins/jquery-ui-timepicker-0.2.9/jquery.ui.timepicker.css
/plugins/jquery-ui-1.8.16/jquery-ui-1.8.16/ui/i18n/jquery.ui.datepicker-ru.js
/plugins/colorpicker/js/colorpicker.js
/plugins/colorpicker/css/colorpicker.css
/plugins/colorpicker/images/colorpicker_background.png
/js/jquery-1.7.1.min.js
/js/jquery.cookie.js
/js/chainvas.min.js
/stylesheets/all.css?v=1
/svg/arrow.svg
/sound/alarm.ogg
/js/all-min.js?v=1
#/_ah/channel/jsapi


# Text external caching
http://maps.gstatic.com/mapfiles/cb/mod_cb_scout/cb_scout_sprite_api_003.png
http://maps.gstatic.com/mapfiles/google_white.png
http://maps.gstatic.com/mapfiles/mv/imgs8.png
http://maps.gstatic.com/mapfiles/mapcontrols3d6.png
http://maps.gstatic.com/mapfiles/rotate2.png
http://maps.gstatic.com/mapfiles/szc4.png
http://maps.gstatic.com/mapfiles/transparent.png
#https://talkgadget.google.com/talkgadget/channel.js


NETWORK:
/
initconfig.js
/_ah/channel
http://localhost/_ah/login
*
""" % (os.environ['APPLICATION_ID'] + '@' + os.environ['SERVER_NAME'], user, os.environ['CURRENT_VERSION_ID'])

		#for i in os.environ.keys():
		#	manifest += '# ' + i + ' = ' + str(os.environ[i]) + '\n'
		self.response.write(manifest)

#class InitConfig(webapp2.RequestHandler):
class InitConfig(BaseHandler):
	def config(self):
		from datamodel.geo import getGeoLast
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		user = users.get_current_user()
		test_value = self.session.get('test-value')
		if test_value:
			pass
		else:
			self.session['test-value'] = 1

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
			Так как эта процедура может занимать много времени, то сделаем это асинхронно
			Хотя все равно уже на 80 системах это занимает около секунды. Не хотется думать что будет при тысяче систем.
		"""
		systems_rpc = account.systems_async
		lasts = getGeoLast(account.systems_key)

		login_url = users.create_login_url('/')
		logout_url = users.create_logout_url('/')

		systems = [sys.todict() for sys in systems_rpc.get_result()]

		for s in systems:
			s['last'] = lasts[s['key']]

		return {
			'version': VERSION,
			'session': {
				'test_value': test_value,
			},
			'server_name': os.environ['SERVER_NAME'],
			'account': {
				'key': str(account.key()),
				'user': {
					'email': account.user.email(),
					'nickname': account.user.nickname(),
					'id': account.user.user_id(),
					'login_url': login_url,
					'logout_url': logout_url,
					'admin': users.is_current_user_admin(),
				},
				'config': account.pconfig,
				'name': account.name,
				'systems': systems
			}
		}

	#@login_required
	def get(self):
		self.response.write('console.log("initconfig.js"); config = $.extend(config, ' + json.dumps(self.config(), indent=2) + ');\r')


class AddLog(webapp2.RequestHandler):
	def get(self):
		#from datamodel import DBNewConfig, DBAccounts
		from datamodel.logs import GPSLogs
		from datamodel.accounts import DBAccounts

		from datetime import datetime
		from inform import Informer
		from alarm import Alarm
		from datamodel.channel import inform

		self.response.headers['Content-Type'] = 'application/octet-stream'

		imei = self.request.get('imei', 'unknown')
		#skey = DBSystem.getkey_or_create(imei)
		skey = DBSystem.key_by_imei(imei)

		text = self.request.get('text', None)
		label = int(self.request.get('label', '0'))
		mtype = self.request.get('mtype', None)
		slat = self.request.get('lat', '0000.0000E')
		slon = self.request.get('lon', '00000.0000N')
		fid = self.request.get('fid', 'unknown')
		ceng = self.request.get('ceng', '')

		lat = float(slat[:2]) + float(slat[2:9]) / 60.0
		lon = float(slon[:3]) + float(slon[3:10]) / 60.0

		if slat[-1] == 'S':
			lat = -lat
	
		if slon[-1] == 'W':
			lon = -lon

		data = {
			'lat': lat,
			'lon': lon,
			'fid': fid,
			'ceng': ceng,
			'dt': datetime.now().strftime("%y%m%d%H%M%S")
		}

		if mtype == 'alarm':
			if text is None: text = u'Нажата тревожная кнопка.'
			alarmmsg = Alarm.add_alarm(imei, int(fid, 10), db.GeoPt(lat, lon), ceng)

		if mtype == 'alarm_confirm':
			if text is None:
				akey = self.request.get('akey', None)
				account = DBAccounts.get(db.Key(akey))
				text = u'Тревога подтверждена оператором %s' % account.user.nickname()

		if mtype == 'alarm_cancel':
			if text is None:
				akey = self.request.get('akey', None)
				account = DBAccounts.get(db.Key(akey))
				text = u'Отбой тревоги оператором %s' % account.user.nickname()

		if text != 'ignore me':	# Ping
			gpslog = GPSLogs(parent = skey, text = text, label = label, mtype = mtype, pos = db.GeoPt(lat, lon))
			gpslog.put()

			inform('addlog', skey, {
				'skey': str(skey),
				#'time': gpslog.date.strftime("%d/%m/%Y %H:%M:%S"),
				'time': datetime.utcnow().strftime("%y%m%d%H%M%S"),
				'text': text,
				'label': label,
				'mtype': mtype,
				'key': "%s" % gpslog.key(),
				'data': data,
			})	# Информировать всех пользователей, у которых открыта страница Отчеты

		#newconfigs = DBNewConfig.get_by_imei(imei)
		#newconfig = newconfigs.config
		#if newconfig and (newconfig != {}):
		#	self.response.out.write('CONFIGUP\r\n')
		#	memcache.set("update_config_%s" % imei, "yes")
		""" TBD! Вынести в описание класса """
		"""
		value = memcache.get("update_config_%s" % imei)
		if value is not None:
			if value == "no":
				pass
			elif value == "yes":
				self.response.out.write('CONFIGUP\r\n')
		else:
			newconfigs = DBNewConfig.get_by_imei(imei)
			newconfig = newconfigs.config
			if newconfig and (newconfig != {}):
				memcache.set("update_config_%s" % imei, "yes")
				self.response.out.write('CONFIGUP\r\n')
			else:
				memcache.set("update_config_%s" % imei, "no")


		for info in Informer.get_by_imei(imei):
			self.response.out.write(info + '\r\n')
		"""
		self.response.write('ADDLOG: OK\r\n')


class Config(webapp2.RequestHandler):
	def post(self):
		from datamodel import DBConfig
		from urllib import unquote_plus
		from datamodel.channel import send_message
		#from zlib import compress

		self.response.headers['Content-Type'] = 'application/octet-stream'

		for k,v in self.request.headers.items():
			logging.info("== header: %s = %s" % (str(k), str(v)))

		imei = self.request.get('imei', 'unknown')
		system = DBSystem.get_or_create(imei, phone=self.request.get('phone', None), desc=self.request.get('desc', None))

		cmd = self.request.get('cmd', '')
		if cmd == 'save':
			newconfig = DBConfig.get_by_imei(imei)

			body = ''
			if 'Content-Type' in self.request.headers:
				if self.request.headers['Content-Type'] == 'application/x-www-form-urlencoded':
					body = unquote_plus(self.request.body)
				else:
					body = self.request.body

			logging.info("== CONFIG_BODY: %s" % body)

			config = {}
			for conf in body.split("\n"):
				params = conf.strip().split()
				if len(params) == 4:
					config[params[0]] = (params[1], params[2], params[3])

			newconfig.config = config #compress(repr(config), 9)
			#newconfig.strconfig = repr(config)
			#newconfig.
			newconfig.put()

			#updater.inform('cfgupd', system.key(), {
			#	'skey': str(system.key())
			#})	# Информировать всех пользователей, у которых открыта страница настроек

			#updater.inform_account('change_slist', self.account, {'type': 'Adding'})
			send_message({'msg': 'cfgupd', 'data':{'skey': str(system.key())}}, akeys=[self.account.key()])

			self.response.out.write("CONFIG: OK\r\n")
			return

		self.response.out.write("CONFIG: ERROR\r\n")

class Params(webapp2.RequestHandler):
	def get(self):
		from datamodel import DBConfig, DBNewConfig
		self.response.headers['Content-Type'] = 'application/octet-stream'

		imei = self.request.get('imei', 'unknown')
		system = DBSystem.get_or_create(imei)

		cmd = self.request.get('cmd')

		if cmd == 'params':
			newconfig = DBNewConfig.get_by_imei(imei)
			configs = newconfig.config
			if configs and (configs != {}):
				#self.response.out.write("<tr><th>date: %s</th></tr>" % dbconfig.cdate)
				#configs = eval(zlib.decompress(newconfig[0].config))
				#configs = eval(dbconfig.strconfig)
				for config, value in configs.items():
					#self.response.out.write("<tr><td>%s:%s</td></tr>" % (config, value))
					self.response.out.write("PARAM %s %s\r\n" % (config, value))
				self.response.out.write("FINISH\r\n")
				memcache.set("update_config_%s" % imei, "yes")
			else:
				self.response.out.write("NODATA\r\n")
				memcache.set("update_config_%s" % imei, "no")

		elif cmd == 'cancel':
			newconfigs = DBNewConfig().get_by_imei(imei)
			newconfigs.config = {}
			newconfigs.put()
			memcache.set("update_config_%s" % imei, "no")
			
			#for newconfig in newconfigs:
			#	newconfig.delete()
			self.response.out.write("DELETED")

		elif cmd == 'confirm':
			newconfig = DBNewConfig.get_by_imei(imei)
			newconfigs = newconfig.config

			if newconfigs and (newconfigs != {}):
				saveconfig = DBConfig.get_by_imei(imei)
				config = saveconfig.config

				for pconfig, pvalue in newconfigs.items():
					if pconfig in config:
						config[pconfig] = (config[pconfig][0], pvalue, config[pconfig][2])

				saveconfig.config = config
				saveconfig.put()

				newconfig.config = {}
				newconfig.put()
				memcache.set("update_config_%s" % imei, "no")

				self.response.out.write("CONFIRM")

			else:
				self.response.out.write("NODATA")

		elif cmd == 'check':
			newconfigs = DBNewConfig.get_by_imei(imei)
			newconfig = newconfigs.config
			if newconfig and (newconfig != {}):
				self.response.out.write('CONFIGUP\r\n')
				memcache.set("update_config_%s" % imei, "yes")
			else:
				self.response.out.write('NODATA\r\n')
				memcache.set("update_config_%s" % imei, "no")

		else:
			self.response.out.write('CMD_ERROR\r\n')


class BinBackup(BaseHandler):

	def fix_bin(self, pdata):
		from utils import CRC16
		if ((len(pdata)-2) & 31) != 0:
			while (len(pdata) & 31)!=0:
				pdata += chr(0)
		if (len(pdata) & 31)==0:
			crc = 0
			for byte in pdata:
				crc = CRC16(crc, ord(byte))
			pdata += chr(crc & 0xFF)
			pdata += chr((crc>>8) & 0xFF)
		return pdata

	def get(self):
		from utils import CRC16
		from datamodel import DBGPSBinBackup, DBGPSBin
		#from local import fromUTC
		from datetime import date, datetime, timedelta

		imei = self.request.get('imei')
		system = DBSystem.get_by_imei(imei)

		#if system is None

		cmd = self.request.get('cmd')
		total = 0
		if cmd:
			ukey = self.request.get('key')
			if cmd == 'getbin':
				self.response.headers['Content-Type'] = 'application/octet-stream'
				bindata = db.get(db.Key(ukey))
				pdata = self.fix_bin(bindata.data)

				self.response.out.write(pdata)
				return
			elif cmd == 'fixcrc':
				bindata = db.get(db.Key(ukey))
				pdata = self.fix_bin(bindata.data)
				if pdata != bindata.data:
					bindata.data = pdata
					bindata.put()
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'fixlen':
				bindata = db.get(db.Key(ukey))
				pdata = bindata.data
				while (len(pdata) & 31)!=0: pdata += chr(0)
					
				crc = 0
				for byte in pdata:
					crc = CRC16(crc, ord(byte))
				pdata += chr(crc & 0xFF)
				pdata += chr((crc>>8) & 0xFF)
				bindata.data = pdata
				bindata.put()
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'del':
				db.delete(db.Key(ukey))
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'delall':
				dbbindata = DBGPSBinBackup.all(keys_only=True).order('cdate').ancestor(system).fetch(500)
				if dbbindata:
					db.delete(dbbindata)
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'delold':
				dbbindata = DBGPSBinBackup.all(keys_only=True).filter("cdate <=", datetime.utcnow()-timedelta(days=30)).order('cdate').fetch(500)
				if dbbindata:
					db.delete(dbbindata)
				self.redirect("/binbackup")
				return
			elif cmd == 'pack':
				self.response.headers['Content-Type'] = 'application/octet-stream'
				pdata = ''
				cfilter = self.request.get('filter')
				cnt = self.request.get('cnt')
				count = 500
				if cnt: count = int(cnt)
				today = date.today()
				aftercdate = self.request.get('after')
				asc = self.request.get('asc', 'None')

				if cfilter:
					dbbindata = DBGPSBinBackup.all().filter('cdate >=', today).order('-cdate').ancestor(system).fetch(count)
				else:
					if aftercdate and aftercdate!="None":
						if asc == 'yes':
							dbbindata = DBGPSBinBackup.all().filter("cdate >", datetime.strptime(aftercdate, "%Y%m%d%H%M%S") + timedelta(seconds = 1)).order('cdate').ancestor(system).fetch(count)
						else:
							dbbindata = DBGPSBinBackup.all().filter("cdate >", datetime.strptime(aftercdate, "%Y%m%d%H%M%S") + timedelta(seconds = 1)).order('-cdate').ancestor(system).fetch(count)
					else:
						if asc == 'yes':
							dbbindata = DBGPSBinBackup.all().order('cdate').ancestor(system).fetch(count)
						else:
							dbbindata = DBGPSBinBackup.all().order('-cdate').ancestor(system).fetch(count)

				for bindata in dbbindata:
					if bindata.crcok:
						npdata = bindata.data
						#bindata.datasize = len(npdata)
						if npdata[0] == 'P':	# POST-bug
							continue

						if (len(npdata) & 31)==0:
							pdata += npdata
						else:
							if ((len(npdata)-2) & 31) == 0:
								pdata += npdata[:-2]
							else:
								while (len(npdata) & 31)!=0: npdata += chr(0)
								pdata += npdata

				logging.info("Packets: %d" % len(dbbindata))
				if len(pdata) == 0:
					self.response.headers["BinData"] = "None"
					return

				self.response.headers["BinData"] = "Present"
				crc = 0
				for byte in pdata:
					crc = CRC16(crc, ord(byte))
				pdata += chr(crc & 0xFF)
				pdata += chr((crc>>8) & 0xFF)
				"""
				crc = ord(pdata[-1])*256 + ord(pdata[-2])
				pdata = pdata[:-2]
				_log += '\n==\tData size: %d' % len(pdata)

				"""

				if len(dbbindata) > 0:
					if asc == 'yes':
						self.response.headers["lastcdate"] = "%s" % dbbindata[-1].cdate.strftime("%Y%m%d%H%M%S")
					else:
						self.response.headers["lastcdate"] = "%s" % dbbindata[0].cdate.strftime("%Y%m%d%H%M%S")

				self.response.out.write(pdata)
				return
			elif cmd == 'parce':
				bindata = db.get(db.Key(ukey))
				pdata = bindata.data[:-2]
				#pdata = pdata[:-2]
				"""
				if ((len(pdata)-2) & 31) != 0:
					while (len(pdata) & 31)!=0:
						pdata += chr(0)
				if (len(pdata) & 31)==0:
					crc = 0
					for byte in pdata:
						crc = CRC16(crc, ord(byte))
					pdata += chr(crc & 0xFF)
					pdata += chr((crc>>8) & 0xFF)
				"""
				dataid = 0

				newbin = DBGPSBin(parent = system)
				newbin.dataid = dataid
				newbin.data = pdata #db.Text(pdata)
				newbin.put()

				url = "/bingps/parse?dataid=%s&key=%s" % (dataid, newbin.key())
				#taskqueue.add(url = url % self.key().id(), method="GET", countdown=countdown)
				countdown=0
				taskqueue.add(url = url, method="GET", countdown=countdown)

				cursor = self.request.get('cursor')
				if cursor:
					self.redirect("/binbackup?imei=%s&cursor=%s" % (imei, cursor))
				else:
					self.redirect("/binbackup?imei=%s" % imei)

		if system:
			q = DBGPSBinBackup.all().order('-cdate').ancestor(system)

			cursor = self.request.get('cursor')
			if cursor:
				q.with_cursor(cursor)

			dbbindata = q.fetch(100)

			for bindata in dbbindata:
				bindata.datasize = len(bindata.data)
				if (bindata.datasize & 31)==0:
					bindata.needfix = True
					bindata.wronglen = False
					total += bindata.datasize
				else:
					bindata.needfix = False
					total += bindata.datasize - 2

					if ((bindata.datasize-2) & 31)!=0:
						bindata.wronglen = True
					else:
						bindata.wronglen = False

				if bindata.data[0] == 'P':
					bindata.postbug = True
				else:
					bindata.postbug = False

				bindata.sdate = bindata.cdate	#.strftime("%d/%m/%Y %H:%M:%S")
			total += 2
			allusers = None

			self.response.headers['Content-Type'] = 'text/html'
			self.write_template({
				'imei': imei,
				'dbbindata': dbbindata,
				'cursor': cursor,
				'ncursor': q.cursor(),
				'total': total,
				'system': system,
				'allusers': allusers
			})
			return

		else:
			dbbindata = None
			allusers = DBSystem.all().fetch(500)
			qoldest = DBGPSBinBackup.all().order('cdate').fetch(1)
			if qoldest:
				oldest = qoldest[0].cdate
			else:
				oldest = u"нет записей"
			coldest = DBGPSBinBackup.all(keys_only=True).filter("cdate <=", datetime.utcnow()-timedelta(days=30)).order('cdate').count()

		#template_values = {}
		#template_values['imei'] = uimei
		#template_values['dbbindata'] = dbbindata

		self.response.headers['Content-Type'] = 'text/html'
		#path = os.path.join(os.path.dirname(__file__), 'templates', self.__class__.__name__ + '.html')
		#self.response.out.write(template.render(path, template_values))
		self.write_template({
			'imei': imei,
			'dbbindata': dbbindata,
			'total': total,
			'system': system,
			'allusers': allusers,
			'oldest': oldest,
			'coldest': coldest,
		})


# обновление программного обеспечения
class Firmware(BaseHandler):
	def get(self):
		from datamodel.firmware import DBFirmware
		from utils import CRC16
		cmd = self.request.get('cmd', None)
		key = self.request.get('key', None)
		swid = self.request.get('swid', None)
		if swid is not None:
			swid = int(swid, 16)
		hwid = self.request.get('hwid', None)
		if hwid is not None:
			hwid = int(hwid, 16)
		boot = (self.request.get('boot', 'no') == 'yes')
		subid = int(self.request.get('subid', '0'), 16)

		if cmd:
			if cmd == 'del':
				try:
					DBFirmware.get(db.Key(self.request.get('key', None))).delete()
				finally:
					self.redirect("/firmware")

			elif cmd == 'check':	# Запросить версию самой свежей прошивки
				self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
					
				fw = DBFirmware.get_all(boot=boot, hwid=hwid, subid=subid).order('-swid').get()
				if fw:
					self.response.write("SWID: %04X\r\n" % fw.swid)
				else:
					self.response.write("NOT FOUND\r\n")

			elif cmd == 'getbin':
				self.response.headers['Content-Type'] = 'application/octet-stream'
				if key is not None:
					fw = DBFirmware.get(db.Key(key))
				else:
					fw = DBFirmware.get_all(boot=boot, hwid=hwid, swid=swid).get()
				if fw:
					self.response.write(fw.data)
				else:
					self.response.write('NOT FOUND\r\n')

			elif cmd == 'get':
				if key is not None:
					fw = DBFirmware.get(db.Key(key))
				else:
					fw = DBFirmware.get_all(boot=boot, hwid=hwid, subid=subid, swid=swid).get()

				self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
				if fw:
					by = 0
					line = 0
					crc2 = 0
					self.response.write("SWID:%04X" % fw.swid)
					self.response.write("\r\nLENGTH:%04X" % len(fw.data))

					for byte in fw.data:
						if by == 0:
							self.response.out.write("\r\nLINE%04X:" % line)
							line = line + 1
							by = 32
						self.response.write("%02X" % ord(byte))
						crc2 = CRC16(crc2, ord(byte))
						by = by - 1
					self.response.write("\r\n")
					self.response.write("CRC:%04X\r\n" % crc2)
					self.response.write("ENDDATA\r\n")
				else:
					self.response.write('NOT FOUND\r\n')

			elif cmd == 'getpack':
				if key:
					fw = DBFirmware.get(db.Key(key))
				else:
					fw = DBFirmware.get_all(boot=boot, hwid=hwid, subid=subid, swid=swid).get()

				#self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
				self.response.headers['Content-Type'] = 'text/html'
				if fw:
					by = 0
					line = 0
					crc2 = 0
					self.response.write("SWID:%04X" % fw.swid)
					self.response.write("\r\nLENGTH:%04X" % len(fw.data))

					for byte in fw.data:
						if by == 0:
							self.response.write("\r\nL%03X:" % line)
							line = line + 1
							by = 64
						#self.response.out.write("%02X" % ord(byte))
						#if ord(byte)>=16:
						
						if ord(byte) in (0x0D, 0x0A, 0x00, 0x01):
							self.response.write('\x01' + chr(ord(byte)+32))
						else:
							self.response.write(byte)
						
						"""
						if ord(byte) >= 33:
							self.response.out.write(byte)
						else:
							#self.response.out.write('\x0F' + chr(ord(byte)+32))
							self.response.out.write('\x20' + chr(ord(byte)+32))
						"""
						
						crc2 = CRC16(crc2, ord(byte))
						by = by - 1
					for i in range(by):
						self.response.write('-');	# заполним последнюю строку чтобы не была короткой
						
					self.response.write("\r\nIGNOREME-IGNOREME-IGNOREME-IGNOREME-IGNOREME-IGNOREME-IGNOREME\r\n")
					self.response.write("CRC:%04X\r\n" % crc2)
					self.response.write("ENDDATA\r\n")
				else:
					self.response.write('NOT FOUND\r\n')
			else:
				self.redirect("/firmware")
		else:
			template_values = {}
			firmwares = DBFirmware.get_all(hwid=hwid).fetch(100)
			template_values['firmwares'] = [f.todict() for f in firmwares]
			self.render_template(self.__class__.__name__ + '.html', **template_values)

	def post(self):
		from datamodel.firmware import DBFirmware
		self.response.headers['Content-Type'] = 'text/plain'

		data = {
			'boot': self.request.get('boot'),
			'pdata': self.request.body,
			'hwid': int(self.request.get('hwid'), 16),
			'swid': int(self.request.get('swid'), 16),
			'subid': int(self.request.get('subid', 0), 10)
		}
		DBFirmware.add(data);

		self.response.write("ROM ADDED: %d\r\n" % len(data['pdata']))

class Inform(webapp2.RequestHandler):
	def get(self):
		from datetime import datetime
		from inform import Informer
		from datamodel.channel import send_message
		# Это единственный (пока) способ побороть Transfer-Encoding: chunked
		imei = self.request.get('imei', 'unknown')
		msg = self.request.get('msg', 'unknown')
		if msg == 'ALL':
			Informer.purge_by_imei(imei)
		else:
			Informer.del_by_imei(imei, msg)
		self.response.headers['Content-Type'] = 'application/octet-stream'
		self.response.out.write("OK\r\n")
		self.response.out.write("INFORM: OK\r\n")

		skey = DBSystem.key_by_imei(imei)

		#updater.inform('inform', system.key(), {
		#	'skey': str(system.key()),
		#	'time': datetime.utcnow().strftime("%y%m%d%H%M%S"),
		#	'msg': msg,
		#})
		#updater.inform_account('change_slist', self.account, {'type': 'Adding'})
		send_message({'msg': 'inform', 'data':{
			'skey': str(skey),
			'time': datetime.utcnow().strftime("%y%m%d%H%M%S"),
			'msg': msg,
		}}, skeys=[skey])


class Ping(webapp2.RequestHandler):
	def get(self):
		from inform import Informer
		# Это единственный (пока) способ побороть Transfer-Encoding: chunked
		imei = self.request.get('imei', 'unknown')
		self.response.headers['Content-Type'] = 'application/octet-stream'
		for info in Informer.get_by_imei(imei):
			self.response.out.write(info + '\r\n')
		self.response.out.write("PING: OK\r\n")

#config = {}
#config['webapp2_extras.sessions'] = {
#    'secret_key': 'my-super-secret-key-000',
#}

#app = webapp2.WSGIApplication([
#	('/test.*', TestPage),
#	('/', MainPage),
#], debug=True, config=config)
