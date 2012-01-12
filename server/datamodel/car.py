# -*- coding: utf-8 -*-

"""
	Все что касается информации об объекте, водителе и т.п.
"""

from google.appengine.ext import db
from datetime import datetime, timedelta
import struct
from system import DBSystem
#import zlib
#import pickle

from namespace import at_local, private

DEFAULT_COLLECT = 'DefaultCollect'

"""
	Информация об объекте:
	номер
	модель-марка
	год выпуска
	№ двигателя
	№ кузова
	данные о ремонте/техосмотре
	№ страхового полиса
	комментарий и т.д.

	Предком записи является система, к кторой относится описание.
	При установке описания оно добавляется не удаляя предыдущее. Не знаю пока какая от этого польза, но как минимум будет возможность восстановить описание
	если оно будет случайно или умышленно удалено или испорчено.
	(!) Ничего не получилось. Похоже нельзя чтобы предок и модель были в разных namespace, поэтому ключем модель является IMEI (skey.name()).

"""

class DBCar(db.Model):
	skey = db.StringProperty(multiline=False)		# Ключ в локальном хранилище
	user = db.UserProperty(auto_current_user_add=True)	# Пользователь, создавший описание
	date = db.DateTimeProperty(auto_now_add=True)		# Время создание описания
	number = db.StringProperty(multiline=False)		# Номер
	model = db.StringProperty(multiline=False)		# модель-марка
	year = db.StringProperty(multiline=False) 		# год выпуска
	drive = db.StringProperty(multiline=False)		# № двигателя
	vin = db.StringProperty(multiline=False)		# № кузова
	teh = db.TextProperty()					# данные о ремонте/техосмотре
	casco = db.StringProperty(multiline=False)		# № страхового полиса
	comments = db.TextProperty()				# комментарий и т.д.
	drivers = db.ListProperty(db.Key, default=None)		# Водители (ссылки на записи DBDriver)

	@classmethod
	@at_local
	def set(cls, skey, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		cls(parent=collect_key, key_name=skey.name(), **kwargs).put()

	@classmethod
	@at_local
	def get(cls, skey, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		return cls.get_by_key_name(skey.name(), parent=collect_key)

class DBDriver(db.Model):
	fio = db.StringProperty(multiline=False)		# ФИО водителя
	year = db.DateProperty() 				# дата рождения
	systems_key = db.ListProperty(db.Key, default=None)	# Перечень привязанных систем (их keys)
	pasport = db.StringProperty(multiline=True) 		# номер и серия паспорта (при желании и место регистрации)
	work = db.DateProperty()				# Дата приема на работу (стаж)
	home = db.StringProperty(multiline=False)		# Место проживания
	phone = db.StringProperty(multiline=False)		# Мобильный телефон
	comments = db.TextProperty()				# комментарий и т.д.

	@classmethod
	@at_local
	def set(cls, skey, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		cls(parent=collect_key, key_name=skey.name(), **kwargs).put()

	@classmethod
	@at_local
	def get(cls, skey, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		return cls.get_by_key_name(skey.name(), parent=collect_key)
