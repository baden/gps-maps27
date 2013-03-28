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
	fuel_midle = db.FloatProperty(default=10.0)		# Средний расход топлива
	fuel_stop = db.FloatProperty(default=2.0)		# Средний расход топлива при стоянке с работающим двигателем
	fuel_midle0 = db.IntegerProperty(default=0)		# Коррекция расхода при скорости 0 км/ч
	fuel_midle20 = db.IntegerProperty(default=0)		# Коррекция расхода при скорости 0 км/ч
	fuel_midle40 = db.IntegerProperty(default=0)		# Коррекция расхода при скорости 0 км/ч
	fuel_midle60 = db.IntegerProperty(default=0)		# Коррекция расхода при скорости 0 км/ч
	fuel_midle80 = db.IntegerProperty(default=0)		# Коррекция расхода при скорости 0 км/ч
	fuel_midle100 = db.IntegerProperty(default=0)		# Коррекция расхода при скорости 0 км/ч
	fuel_midle120 = db.IntegerProperty(default=0)		# Коррекция расхода при скорости 0 км/ч

	@classmethod
	@at_local
	def set(cls, skey, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		cls(parent=collect_key, key_name=skey.name(), **kwargs).put()

	@classmethod
	@at_local
	def get(cls, skey, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		q = cls.get_by_key_name(skey.name(), parent=collect_key)
		if q is not None:
			car = {
				'number': q.number,
				'model': q.model,
				'year': q.year,
				'drive': q.drive,
				'vin': q.vin,
				'teh': q.teh,
				'drivers': [],
				'casco': q.casco,
				'comments': q.comments,
				'fuel_midle': q.fuel_midle,
				'fuel_stop': q.fuel_stop,
				'fuel_midle0': q.fuel_midle0,
				'fuel_midle20': q.fuel_midle20,
				'fuel_midle40': q.fuel_midle40,
				'fuel_midle60': q.fuel_midle60,
				'fuel_midle80': q.fuel_midle80,
				'fuel_midle100': q.fuel_midle100,
				'fuel_midle120': q.fuel_midle120,
			}
		else:
			car = {
				'number': '',
				'model': '',
				'year': '',
				'drive': '',
				'vin': '',
				'teh': '',
				'drivers': [],
				'casco': '',
				'comments': '',
				'fuel_midle': 10.0,
				'fuel_stop': 1.0,
				'fuel_midle0': 168,
				'fuel_midle20': 68,
				'fuel_midle40': 0,
				'fuel_midle60': -32,
				'fuel_midle80': 0,
				'fuel_midle100': 33,
				'fuel_midle120': 68,
			}
		return car

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
