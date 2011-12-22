# -*- coding: utf-8 -*-
from google.appengine.ext import db

class DBFirmware(db.Model):
	cdate = db.DateTimeProperty(auto_now_add=True)	# Дата размещения прошивки
	boot = db.BooleanProperty(default=False)	# Устанавливается в True если это образ загрузчика
	hwid = db.IntegerProperty()			# Версия аппаратуры
	swid = db.IntegerProperty()			# Версия прошивки
	subid = db.IntegerProperty(default=0)		# Подверсия аппаратуры (введена из-за 6000ков)
	data = db.BlobProperty()			# Образ прошивки
	size = db.IntegerProperty()			# Размер прошивки (опция)
	desc = db.StringProperty(multiline=True)	# Описание прошивки (опция)
