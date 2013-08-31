# -*- coding: utf-8 -*-

from core import BaseApi

from google.appengine.ext import db
from datamodel import DBAccounts, DBSystem
from google.appengine.api import memcache
import logging
import json

class Add(BaseApi):
	requred = ('account', 'imei')
	def parcer(self, **argw):
		from datamodel.channel import inform_account
		from datamodel.geo import getGeoLast
		from datamodel.admin import DBAdmin
		#from datamodel.namespace import private

		#res = self.account.AddSystem(self.imei)

		skey = DBSystem.imei2key(self.imei)

		if skey in self.account.systems_key:
			#DBAdmin.addOperation(self.akey, u'Пользователь пытался добавить систему за которой уже наблюдает.', {'imei': self.imei})
			return {'answer': 'no', 'result': 'already'}

		#system = DBSystem.get_by_imei(self.imei)
		system = DBSystem.get(skey)

		if system is None:
			DBAdmin.addOperation(self.akey, u'Пользователь пытался добавить несуществующую систему.', {'imei': self.imei})
			return {'answer': 'no', 'result': 'not found'}

		def transaction(key, add_value):
			obj = db.get(key)
			obj.systems_key.append(add_value)
			obj.put()
			memcache.delete("DBUpdater:skeys:%s" % str(key))

		db.run_in_transaction(transaction, self.account.key(), system.key())

		#self.account.systems_key.append(system.key())
		#self.account.put()	# TODO!!! Обязательно переделать на изменение через транзакцию!!!

		DBAdmin.addOperation(self.akey, u'Пользователь добавил систему.', {'imei': self.imei})
		rsystem = system.todict()
		rsystem['last'] = getGeoLast([skey])[str(skey)]
		"""
		send_message({
			'msg': 'change_slist',
			'data':{
				'type': 'Adding',
				'system': rsystem
			}
		}, akeys=[self.akey], domain=private())
		"""

		# Временно (или уже навсегда) убираем возможность работать в несколько окон
		#inform_account(self.akey, 'change_slist', {'type': 'Adding', 'system': rsystem})

		return {'answer': 'yes', 'result': 'added', 'system': rsystem}

class Del(BaseApi):
	requred = ('account', 'skey')
	def parcer(self, **argw):
		from datamodel.channel import inform_account
		#from datamodel.namespace import private

		"""
		res = self.account.DelSystem(self.skey)
		if res == 0:
			return {'answer': 'no', 'result': 'not found'}		# Этот ответ больше не поддерживается
		elif res == 2:
			return {'answer': 'no', 'result': 'already'}
		"""

		if self.skey not in self.account.systems_key:
			return {'answer': 'no', 'result': 'already'}

		def transaction(key, value):
			obj = db.get(key)
			obj.systems_key.remove(value)
			obj.put()
			memcache.delete("DBUpdater:skeys:%s" % str(key))

		db.run_in_transaction(transaction, self.account.key(), self.skey)

		#inform_account('change_slist', self.account, {'type': 'Deleting'})
		#send_message({'msg': 'change_slist', 'data':{'type': 'Deleting'}}, akeys=[self.akey], domain=private())

		# Временно (или уже навсегда) убираем возможность работать в несколько окон
		#inform_account(self.akey, 'change_slist', {'type': 'Deleting', 'skey': str(self.skey)})
		return {'answer': 'yes', 'result': 'deleted'}

class Sort(BaseApi):
	requred = ('account', 'skey')
	def parcer(self, **argw):
		from datamodel.channel import inform_account
		#from datamodel.namespace import private

		slist = [db.Key(k) for k in json.loads(self.request.get('slist', '[]'))]
		#try:
		#	slist = [db.Key(k) for k in json.loads(self.request.get('slist', '[]'))]
		#except:
		#	slist = self.account.systems_key
		logging.info('=== Sort %s' % repr(slist))

		#if self.account.systems_key != slist:
		#	self.account.systems_key = slist
		#	self.account.put()	# TODO!!! Обязательно переделать на изменение через транзакцию!!!

		def transaction(key, value):
			obj = db.get(key)
			obj.systems_key = value
			obj.put()
			memcache.delete("DBUpdater:skeys:%s" % str(key))

		db.run_in_transaction(transaction, self.account.key(), slist)

			# Временно (или уже навсегда) убираем возможность работать в несколько окон
			#inform_account(self.akey, 'change_slist', {'type': 'Sorting', 'slist': [str(s) for s in slist]})

		return {'result': 'ok', 'slist': [str(s) for s in slist]}

class Desc(BaseApi):
	#requred = ('account', 'imei')
	requred = ('account', 'skey')
	def parcer(self, **argw):
		from datamodel.channel import inform
		from datamodel.namespace import private
		import pickle

		desc = self.request.get('desc', None)
		if desc is None:
			return {'answer': 'no', 'reason': 'desc not defined'}

		#system = self.account.system_by_imei(self.imei)
		#if
		system = DBSystem.get(self.skey)
		if system is None:
			return {'answer': 'no', 'reason': 'nosys'}
		#system.desc = desc
		olddescs = pickle.loads(system.descbydomain)
		olddescs[private()] = desc
		system.descbydomain = pickle.dumps(olddescs)
		system.put()
		
		inform(self.skey, 'change_desc', {
			'desc': desc
		}, domain=private())

		return {'result': 'ok', 'skey': str(self.skey), 'imei': system.imei, 'desc': desc}

class Tags(BaseApi):
	requred = ('account', 'skey')
	def parcer(self, **argw):
		from datamodel.channel import inform
		from datamodel.namespace import private
		import pickle

		tags = json.loads(self.request.get('tags', '[]'))
		if tags is None:
			return {'answer': 'no', 'reason': 'tags not defined'}

		#system = self.account.system_by_imei(self.imei)
		#if
		system = DBSystem.get(self.skey)
		if system is None:
			return {'answer': 'no', 'reason': 'nosys'}

		oldtags = pickle.loads(system.tags)
		oldtags[private()] = tags
		system.tags = pickle.dumps(oldtags)
		system.put()

		logging.warning('SKEY: %s (%s)', self.skey, repr(self.skey))
		
		inform(self.skey, 'change_tag', {
			'tags': tags
		}, domain=private())

		return {'result': 'ok', 'skey': str(self.skey), 'tags': tags}

class Car(BaseApi):
	requred = ('account', 'skey')
	def parcer(self, **argw):
		from datamodel.channel import inform
		from datamodel.namespace import private
		from datamodel.car import DBCar
		import pickle

		if self.request.get('cmd', '') == 'get':
			car = DBCar.get(self.skey)
		elif self.request.get('cmd', '') == 'set':
			car = {'set': 'set', 'params': self.request.POST.items()}
			# TBD   datamodel.car    .get
			DBCar.set( self.skey,
				number = self.request.POST['number'],
				model = self.request.POST['model'],
				year = self.request.POST['year'],
				drive = self.request.POST['drive'],
				vin = self.request.POST['vin'],
				teh = self.request.POST['teh'],
				casco = self.request.POST['casco'],
				comments = self.request.POST['comments'],
				fuel_midle = float(self.request.POST['fuel_midle'].replace(',','.')),
				fuel_stop = float(self.request.POST['fuel_stop'].replace(',','.')),
				fuel_midle0 = int(self.request.POST['fuel_midle0']),
				fuel_midle20 = int(self.request.POST['fuel_midle20']),
				fuel_midle40 = int(self.request.POST['fuel_midle40']),
				fuel_midle60 = int(self.request.POST['fuel_midle60']),
				fuel_midle80 = int(self.request.POST['fuel_midle80']),
				fuel_midle100 = int(self.request.POST['fuel_midle100']),
				fuel_midle120 = int(self.request.POST['fuel_midle120']),
			)
		else:
			return {'result': 'error', 'reason': 'unknown operation'}

		return {'result': 'ok', 'skey': str(self.skey), 'info': car}


class Config(BaseApi):
	requred = ('skey')
	def parcer(self, **argw):
		#from zlib import decompress
		from datamodel.configs import DBConfig, DBDescription, DBNewConfig
		from google.appengine.api import memcache

		cmd = self.request.get('cmd', None)
		if cmd is None:
			return {'answer': 'no', 'reason': 'cmd not defined'}

		# Запросить список программируемых параметров
		if cmd == 'get':
			collect_key = db.Key.from_path('DefaultCollect', 'DBDescription')
			# TBD! Чтение всех коментарием выглядит идиотизмом.
			descriptions = DBDescription.all().ancestor(collect_key) #.fetch(MAX_TRACK_FETCH)

			descs={}
			fdescs={}
			for description in descriptions:
				descs[description.name] = description.value
				fdescs[description.name] = {
					'name': description.name,
					'value': description.value,
					'unit': description.unit,
					'coef': description.coef,
					'mini': description.mini,
					'maxi': description.maxi,
					'private': description.private
				}

			config = DBConfig.get_by_imei(self.skey.name())
			configs = config.config
			'''
			if config.config:
				configs = eval(decompress(config.config))
			else:
				configs = {}
			'''
			waitconfigs = DBNewConfig.get_by_imei(self.skey.name())
			waitconfig = waitconfigs.config
			'''
			if waitconfigs.config:
				waitconfig = eval(decompress(waitconfigs.config))
			else:
				waitconfig = {}
			'''
			nconfigs = {}

			for config, value in configs.items():
				#desc = u"Нет описания"
				desc = None	#u"Нет описания"
				fdesc = None
				if config in descs:
					desc = descs[config]
					fdesc = fdescs[config]
				else:
					pass
					#continue

				if config in waitconfig: wc = waitconfig[config]
				else: wc = None

				nconfigs[config] = {
					'type': configs[config][0],
					'value': configs[config][1],
					'default': configs[config][2],
					'desc': desc,
					'fdesc': fdesc,
					'wait': wc
				}

				"""
				if config in waitconfig:
					nconfigs[config] = (configs[config][0], configs[config][1], configs[config][2], waitconfig[config], desc, fdesc)
				else:
					nconfigs[config] = (configs[config][0], configs[config][1], configs[config][2], None, desc, fdesc)
					#configs[config] = (configs[config][0], configs[config][1], configs[config][2], configs[config][1])
				"""

			# Для удобства отсортируем словарь в список
			#sconfigs = sortDict(configs)
			sconfigs = [(key, nconfigs[key]) for key in sorted(nconfigs.keys())]

			return {
				'answer': 'ok',
				'config': sconfigs,
				'raw': configs
			}

		# Установить параметр
		if cmd == 'set':
			#import inform
			#from zlib import compress, decompress
			name = self.request.get('name', 'unknown')
			value = self.request.get('value', '0')

			waitconfigs = DBNewConfig.get_by_imei(self.skey.name())
			waitconfig = waitconfigs.config
			'''
			if waitconfigs.config:
				waitconfig = eval(decompress(waitconfigs.config))
			else:
				waitconfig = {}
			'''
			waitconfig[name] = value
			waitconfigs.config = waitconfig #compress(repr(waitconfig), 9)
			waitconfigs.put()
			memcache.set("update_config_%s" % self.skey.name(), "yes")

			#inform.send_by_imei(self.imei, 'CONFIGUP')

		# Отменить задание (действие аналогичное /params?cmd=check&imei=xxxxxxxx)
		if cmd == 'cancel':
			newconfigs = DBNewConfig().get_by_imei(self.skey.name())
			newconfigs.config = {}
			newconfigs.put()
			memcache.set("update_config_%s" % self.skey.name(), "no")

		if cmd == 'fwupdate':
			memcache.set("fwupdate_%s" % self.skey.name(), "yes")

			#inform.send_by_imei(self.imei, 'CONFIGUP')

		return {'result': 'ok'}

class SecureList(BaseApi):
	requred = ('admin')
	def parcer(self):
		from google.appengine.api import users
		from google.appengine.ext.db.metadata import Namespace

		user = users.get_current_user()

		key = self.request.get("key", None)
		if key is not None:
			key = db.Key(key)
			parent = key.parent()
			if parent is not None:
				parent = {
					'key': str(parent),
					'app': parent.app(),
					'has_id_or_name': parent.has_id_or_name(),
					'id': parent.id(),
					'id_or_name': parent.id_or_name(),
					'kind': parent.kind(),
					'name': parent.name(),
					'namespace': parent.namespace(),
					'parent': str(parent.parent())
				}
			key = {
				'key': str(key),
				'app': key.app(),
				'has_id_or_name': key.has_id_or_name(),
				'id': key.id(),
				'id_or_name': key.id_or_name(),
				'kind': key.kind(),
				'name': key.name(),
				'namespace': key.namespace(),
				'parent': parent
			}

		sysinfos = []
		#systems = DBSystem.all(keys_only=True).fetch(1000)
		systems = DBSystem.get_all(keys_only=True) #.fetch(1000)
		for rec in systems:
			sysinfos.append({'imei': rec.name(), 'key': "%s" % rec, })

		name_spaces = [str(p.namespace_name) for p in db.GqlQuery("SELECT * FROM __namespace__").fetch(100)]

		return {
			'answer': 'ok',
			'info': {
				'systems': sysinfos,
				'key': key,
			},
			'user': {
				'user_id': user.user_id(),
				'admin': users.is_current_user_admin(),
			},
			'name_spaces': name_spaces,
			'accounts': [{
				'key': str(e.key()),
				'name': e.name,
				'systems_key': [s.name() for s in e.systems_key],
				'register': str(e.register),
				'config_list': str(e.config_list),
				'access': e.access,
			} for e in DBAccounts.get_all().fetch(1000)],
		}

#class SystemConfig(webapp2.RequestHandler):
class SaveConfig(BaseApi):
	requred = ('account')
	def parcer(self):
		#from urllib import unquote_plus

		config = self.account.getconfig()
		#newconfig = {(k:self.request.get(k)) for k in self.request.arguments()}
		newconfig = dict((k, self.request.get(k)) for k in self.request.arguments())
		#newconfig = {}
		#for k in self.request.arguments():
		#	newconfig[k] = self.request.get(k)

		config.update(newconfig)

		#logging.info(repr(newconfig))
		#config.
		#for k in self.request.arguments():
		#	if k in config
		self.account.putconfig(config)

		return {'answer': 'ok', 'dump': json.dumps(config) + "\r"}

class SetIcon(BaseApi):
	#requred = ('account', 'imei')
	requred = ('account', 'skey')
	def parcer(self, **argw):
		from datamodel.channel import inform
		from datamodel.namespace import private
		import pickle

		name = self.request.get('name', 'car')

		#system = self.account.system_by_imei(self.imei)
		#if
		system = DBSystem.get(self.skey)
		if system is None:
			return {'answer': 'no', 'reason': 'nosys'}
		#system.desc = desc
		oldicon = pickle.loads(system.icon)
		oldicon[private()] = name
		system.icon = pickle.dumps(oldicon)
		system.put()
		
		inform(self.skey, 'change_icon', {
			'name': name
		}, domain=private())

		return {'result': 'ok', 'skey': str(self.skey), 'imei': system.imei, 'name': name}
