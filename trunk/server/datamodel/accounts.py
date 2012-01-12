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
	"""
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
	"""
	@property
	def systems(self):
		"""
		for skey in self.systems_key:
			try:
				s = DBSystem.get(skey)
				if s: yield s
			except:
				pass
		"""
		rpc = db.create_rpc(deadline=10, read_policy=db.EVENTUAL_CONSISTENCY)	# Это позволяет генерировать один вызов для всех ключей (и дает значительную экономию по скорости)
		return DBSystem.get(self.systems_key, rpc=rpc)
		#return db.get(self.systems_key, rpc=rpc)

	@property
	def systems_async(self):
		"""
		for skey in self.systems_key:
			try:
				s = DBSystem.get(skey)
				if s: yield s
			except:
				pass
		"""
		rpc = db.create_rpc(deadline=10, read_policy=db.EVENTUAL_CONSISTENCY)	# Это позволяет генерировать один вызов для всех ключей (и дает значительную экономию по скорости)
		#return DBSystem.get_async(self.systems_key, rpc=rpc)
		return db.get_async(self.systems_key, rpc=rpc)

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
	#def AddSystem(self, imei):
	#	system = DBSystem.get_by_imei(imei)
	#	if system is None:
	#		return 0
	#	if system.key() not in self.systems_key:
	#		self.systems_key.append(system.key())
	#		self.put()
	#		return 1
	#	return 2

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
	def key_from_user_id(cls, user_id, domain=None):
		if domain is None:
			domain = private()
		return db.Key.from_path(DEFAULT_COLLECT, cls.__name__, cls.__name__, user_id, namespace=domain)

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




"""
 Запись о домене
	ключ - имя домена private()
"""
class DBDomain(db.Model):
	register = db.DateTimeProperty(auto_now_add=True)		# Дата регистрации домена (первый вход)
	owner = db.UserProperty(auto_current_user_add=True)		# Пользователь, создавший доменную зону (первый выполнивший вход)
	premium = db.DateTimeProperty(auto_now_add=True)		# Дата окончания премиум-подписки (абон-плата).
	desc = db.StringProperty(multiline=False, default=u'Описание')	# Описание зоны - отображаемое в заголовке имя
	comments = db.TextProperty(default=u'Примечания')		# Примечания
	active = db.BooleanProperty(default=True)			# Если значение False, то данный домен заблокирован для использования
	lock = db.BooleanProperty(default=False)			# Если значение True, то данный домен заблокирован для добавления новых пользователей

	@classmethod
	def set(cls, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		r = cls(parent=collect_key, key_name=private(), **kwargs)
		r.put()
		return r

	@classmethod
	def get(cls):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		return cls.get_by_key_name(private(), parent=collect_key)

	def todict(self):
		from datetime import datetime
		return {
			'key': str(self.key()),
			'dkey': str(self.key()),
			'register': self.register.strftime('%y%m%d%H%M%S'),
			'owner': self.owner.nickname(),
			'desc': self.desc,
			'comments': self.comments,
			'premium': self.premium >= datetime.utcnow(),
			'active': self.active,
			'lock': self.lock
		}
