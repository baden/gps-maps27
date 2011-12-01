# -*- coding: utf-8 -*-

from google.appengine.ext import db
from datetime import datetime, timedelta
import struct
from system import DBSystem
#import zlib
#import pickle

from namespace import at_local, private

"""
 Запись о пользователе
"""
DEFAULT_CONFIG = repr({
	'theme': 'cupertino',
})

DEFAULT_COLLECT = 'DefaultCollect'

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
		return skey in self.systems_key

	def system_by_imei(self, imei):
		skey = DBSystem.imei2key(imei)
		if skey not in self.systems_key:
			return None
		return db.get(skey)

	def system_by_skey(self, skey):
		if skey not in self.systems_key:
			return None
		return db.get(skey)


	"""
	def RegisterSystem(self, imei):
		system = DBSystem.get_by_key_name(imei)
		if system is None:
			system = DBSystem(key_name = imei, imei=imei)
			system.put()

		if system.key() not in self.systems_key:
			self.systems_key.append(system.key())
			self.put()
	"""
	def AddSystem(self, imei):
		system = DBSystem.get_by_imei(imei)
		if system is None:
			return 0

		if system.key() not in self.systems_key:
			self.systems_key.append(system.key())
			self.put()
			return 1
		return 2

	def DelSystem(self, skey):
		#system = DBSystem.get_by_imei(imei)
		#if system is None:
		#	return 0

		if skey in self.systems_key:
			self.systems_key.remove(skey)
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

	#@classmethod
	#def key_from_user(cls, user):
	#	return db.Key.from_path('DefaultCollect', cls.__name__, 'DBAccounts', user_id.user_id(), namespace=private())

	@classmethod
	def key_from_user_id(cls, user_id):
		return db.Key.from_path(DEFAULT_COLLECT, cls.__name__, cls.__name__, user_id, namespace=private())

	# Создает нового пользователя если это необходимо
	@classmethod
	@at_local
	def get_by_user(cls, user):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		return cls.get_or_insert(user.user_id(), user=user, parent=collect_key)

	# Получает список всех пользователей.
	#@at_local
	@classmethod
	def get_all(cls):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__, namespace=private())
		#for e in 
		#return cls.all().ancestor(collect_key).run()	#fetch(1000)
		return cls.all(namespace=private()).ancestor(collect_key)	#fetch(1000)
