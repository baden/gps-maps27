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

#logging.getLogger().setLevel(logging.WARNING)

SERVER_NAME = os.environ['SERVER_NAME']

#import sys
#sys.path.append('../')
#from plugins import BaseHandler

class AddLog(webapp2.RequestHandler):
	def get(self):
		#from datamodel import DBNewConfig, DBAccounts
		from datamodel.configs import DBNewConfig
		from google.appengine.api import memcache
		from datamodel.logs import AddLog

		from datetime import datetime

		self.response.headers['Content-Type'] = 'application/octet-stream'

		imei = self.request.get('imei', 'unknown')
		slat = self.request.get('lat', '0000.0000E')
		slon = self.request.get('lon', '00000.0000N')

		lat = float(slat[:2]) + float(slat[2:9]) / 60.0
		lon = float(slon[:3]) + float(slon[3:10]) / 60.0

		if slat[-1] == 'S':
			lat = -lat
	
		if slon[-1] == 'W':
			lon = -lon

		log = {
			'imei': imei,
			'skey': DBSystem.key_by_imei(imei),
			'akey': self.request.get('akey', None),
			'text': self.request.get('text', None),
			'label': int(self.request.get('label', '0'), 10),
			'mtype': self.request.get('mtype', None),
			'lat': lat,
			'lon': lon,
			'fid': int(self.request.get('fid', '0'), 10),
			'ceng': self.request.get('ceng', ''),
			'dt': datetime.now().strftime("%y%m%d%H%M%S")
		}

		#skey = DBSystem.getkey_or_create(imei)

		AddLog(log)

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

		self.response.write('ADDLOG: OK\r\n')

#os.environ['CONTENT_TYPE'] = 'application/octet-stream'
#os.environ['HTTP_CONTENT_TYPE'] = 'application/octet-stream'

class Config(webapp2.RequestHandler):
	def post(self):
		from datamodel.configs import DBConfig
		from urllib import unquote_plus
		#from datamodel.channel import inform_account
		from datamodel.channel import inform
		#from zlib import compress

		os.environ['HTTP_CONTENT_TYPE'] = "application/octet-stream"		# Патч чтобы SIMCOM мог слать сырые бинарные данные
		os.environ['CONTENT_TYPE'] = "application/octet-stream"		# Патч чтобы SIMCOM мог слать сырые бинарные данные

		body = self.request.body

		self.response.headers['Content-Type'] = 'application/octet-stream'

		#for k,v in self.request.headers.items():
		#	logging.info("== header: %s = %s" % (str(k), str(v)))

		imei = self.request.get('imei', 'unknown')
		phone = self.request.get('phone', u'Не поддерживается')
		#system = DBSystem.get_or_create(imei, phone=self.request.get('phone', None), desc=self.request.get('desc', None))
		#TBD! Нет сохранения телефона
		skey = DBSystem.key_by_imei(imei)
		system = DBSystem.get(skey)

		if system.phone != phone:
			system.phone = phone
			system.put()

		cmd = self.request.get('cmd', '')
		if cmd == 'save':
			newconfig = DBConfig.get_by_imei(imei)

			if 'Content-Type' in self.request.headers:
				if self.request.headers['Content-Type'] == 'application/x-www-form-urlencoded':
					#body = unquote_plus(self.request.body)
					#body = unquote(self.request.body)
					body = unquote(body)

			logging.info("== CONFIG_BODY: %s" % repr(body))

			config = {}
			for conf in body.split("\n"):
				params = conf.strip().split()
				#logging.info("== PARAM: %s" % repr(params))
				if len(params) == 4:
					config[params[0]] = (params[1], params[2], params[3])

			#logging.info("== CONFIG: %s" % repr(config))
			newconfig.config = config #compress(repr(config), 9)
			#newconfig.strconfig = repr(config)
			#newconfig.
			newconfig.put()

			#updater.inform('cfgupd', system.key(), {
			#	'skey': str(system.key())
			#})	# Информировать всех пользователей, у которых открыта страница настроек

			#updater.inform_account('change_slist', self.account, {'type': 'Adding'})
			#send_message({'msg': 'cfgupd', 'data':{'skey': str(system.key())}}, akeys=[self.account.key()])
			#inform_account(self.account.key(), 'cfgupd', {'skey': str(system.key())})
			inform(skey, 'cfgupd', {'skey': str(skey)})

			self.response.out.write("CONFIG: OK\r\n")
			return

		self.response.out.write("CONFIG: ERROR\r\n")

class Params(webapp2.RequestHandler):
	def get(self):
		from datamodel.configs import DBConfig, DBNewConfig
		from google.appengine.api import memcache

		self.response.headers['Content-Type'] = 'application/octet-stream'

		imei = self.request.get('imei', 'unknown')
		#system = DBSystem.get_or_create(imei)
		skey = DBSystem.key_by_imei(imei)		

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


# обновление программного обеспечения
#from plugins.test import BaseHandler

# Тут осталось толь та часть, которая относится к отправке прошивки в системы

class Firmware(webapp2.RequestHandler):
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
				self.response.write('ERROR CMD\r\n')

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
		from datamodel.channel import inform
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
		"""
		send_message({'msg': 'inform', 'data':{
			'skey': str(skey),
			'time': datetime.utcnow().strftime("%y%m%d%H%M%S"),
			'msg': msg,
		}}, skeys=[skey])
		"""
		inform(skey, 'inform', {
			'skey': str(skey),
			'time': datetime.utcnow().strftime("%y%m%d%H%M%S"),
			'msg': msg
		})


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
