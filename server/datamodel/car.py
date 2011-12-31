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

"""

class DBCar(db.Model):
	user = db.UserProperty()			# Пользователь, создавший описание
	date = db.DateTimeProperty(auto_now_add=True)	# Время создание описания
	number = db.StringProperty(multiline=False)	# Номер
	model = db.StringProperty(multiline=False)	# модель-марка
	year = db.IntegerProperty(default=0) 		# год выпуска
	drive = db.StringProperty(multiline=False)	# № двигателя
	vin = db.StringProperty(multiline=False)	# № кузова
	teh = db.StringProperty(multiline=True)		# данные о ремонте/техосмотре
	casco = db.StringProperty(multiline=False)	# № страхового полиса
	comments = db.TextProperty()			# комментарий и т.д.

	@classmethod
	@at_local
	def set(cls, akey, **kwargs):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		cls(parent=akey, **kwargs).put()
