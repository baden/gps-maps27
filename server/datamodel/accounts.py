# -*- coding: utf-8 -*-

from google.appengine.ext import db
from datetime import datetime, timedelta
import struct
from system import DBSystem
#import zlib
#import pickle

"""
 Запись о пользователе
"""
DEFAULT_CONFIG = repr({
	'theme': 'cupertino',
})

class DBAccounts(db.Model):
	user = db.UserProperty()						# Пользователь
	name = db.StringProperty(multiline=False, default=u"Имя не задано")	# Отображаемое имя
	systems_key = db.ListProperty(db.Key, default=None)			# Перечень наблюдаемых систем (их keys)
	register = db.DateTimeProperty(auto_now_add=True)			# Дата регистрации аккаунта
	config_list = db.StringProperty(multiline=True, default=DEFAULT_CONFIG)	# Список записей конфигурации
	access = db.IntegerProperty(default=0)					# Уровень доступа
										# 0-только просмотр, 1-возможность конфигурирования, 2-возможность правки данных и т.д.
	@property
	def systems(self):
		system_list = []
		purge = False
		for i, rec in enumerate(self.systems_key):
			s = db.get(rec)
			if s is not None:
				system_list.append(s)
			else:
				del self.systems_key[i]
				purge = True
		if purge:
			self.put()
		return system_list

	# Возвращает True если система с таким key контроллируется аккаунтом
	def has_skey(self, skey):
		return skey in systems_key

	def system_by_imei(self, imei):
		skey = db.Key.from_path('DBSystem', imei)
		if skey not in self.systems_key:
			return None
		return db.get(skey)
	
	def RegisterSystem(self, imei):
		system = DBSystem.get_by_key_name(imei)
		if system is None:
			system = DBSystem(key_name = imei, imei=imei)
			system.put()

		if system.key() not in self.systems_key:
			self.systems_key.append(system.key())
			self.put()

	def AddSystem(self, imei):
		system = DBSystem.get_by_key_name(imei)
		if system is None:
			return 0

		if system.key() not in self.systems_key:
			self.systems_key.append(system.key())
			self.put()
			return 1
		return 2

	def DelSystem(self, imei):
		system = DBSystem.get_by_key_name(imei)
		if system is None:
			return 0

		if system.key() in self.systems_key:
			self.systems_key.remove(system.key())
			self.put()
			return 1
		return 2

	@property
	def single(self):
		return len(systems_key) == 1

	@property
	def config(self):
		import json
		return json.dumps(self.getconfig(), indent=2)

	@property
	def pconfig(self):
		return self.getconfig()

	def getconfig(self):
		#configs = pickle.loads(self.config_list)
		#for rec in self.config_list:
		#	configs.append(eval(rec))
		return eval(self.config_list)

	def putconfig(self, configdict):
		self.config_list = repr(configdict)
		self.put()
