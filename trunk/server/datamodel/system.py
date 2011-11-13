# -*- coding: utf-8 -*-

"""
	Процедуры работы с системой.
"""

from google.appengine.ext import db

#DEFAULT_COLLECT = 'default_collect'
FAKE_IMEI = '000000000000000'

class DBSystem(db.Model):
	imei = db.StringProperty(multiline=False)				# IMEI
	phone = db.StringProperty(multiline=False, default=u"Не определен")	# Phone number, for example: +380679332332
	date = db.DateTimeProperty(auto_now_add=True)				# Дата регистрации системы
	desc = db.StringProperty(multiline=False, default=u"Нет описания")	# Описание
	premium = db.DateTimeProperty(auto_now_add=True)			# Дата окончания премиум-подписки (абон-плата).
										# Без премиум-подписки функционал ограничен.

	# Добавляем...
	password = db.StringProperty(default=None)	# Если это поле задано, то все "наблюдатели" должны иметь этот-же ключ для доступа к системе
	#groups = db.ListProperty(db.Key, default=None)	# Перечень ключей к записям групп, в которые входит система
	#						# Это ссылки на "глобальные" группы. Локальные группы могут быть назначены каждым пользователем.


	#@classmethod
	#def collect_key(cls, collect_name=None):
	#	return db.Key.from_path('DBSystem', collect_name or DEFAULT_COLLECT)

	""" Получает ключ для системы с указанным имеем, и если системы нет в базе, то она добавляется в базу """
	@classmethod
	#def key_by_imei(cls, imei=FAKE_IMEI, collect_name=None):
	def key_by_imei(cls, imei=FAKE_IMEI):
		from google.appengine.api import memcache
		value = memcache.get("DBSystem:%s" % imei)
		if value is not None:
			return db.Key(value)
		else:
			#model = cls.get_or_insert(imei, parent = cls.collect_key(collect_name), imei=imei)
			model = cls.get_or_insert(imei, imei=imei)
			memcache.set("DBSystem:%s" % imei, str(model.key()))
			return model.key()
