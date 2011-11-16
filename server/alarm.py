# -*- coding: utf-8 -*-

from google.appengine.ext import db
from google.appengine.api import memcache
from datetime import datetime, timedelta
from datamodel import DBAccounts, DBSystem
import logging
#
#  Используется для отправки системе сообщений.
#  - информирование о смене конфигурации (пока не используется)
#  - подтверждение тревоги для SIM20
#  - отмена тревоги для SIM20
#
class Alarm(db.Model):
	cdate = db.DateTimeProperty(auto_now_add=True)		# Время создания тревоги
	system = db.ReferenceProperty(DBSystem)			# Система, вызвавшая тревогу
	cdateHistory = db.ListProperty(datetime, default=None)	# Время создания тревоги
	lpos = db.GeoPtProperty()				# Последняя позиция
	fid = db.IntegerProperty()				# FID
	ceng = db.StringProperty(default='')			# Строка инженерного меню (если есть)
	confirmed = db.BooleanProperty(default=False)		# Получение тревоги подтверждено
	confirmby = db.ReferenceProperty(DBAccounts, default=None)	# Оператор, подтвердивший тревогу -> DBAccounts
	confirmwhen = db.DateTimeProperty()			# Время подтвердения тревоги

	@classmethod
	def add_alarm(cls, imei, fid, lpos, ceng):
		#entity = cls(key_name="alarm_%s" % system.imei, system_key=system)
		#entity.put()
		def txn():
			entity = cls.get_by_key_name("alarm_%s" % imei)
			if entity is None:
				#entity = cls(key_name="alarm_%s" % imei, system=DBSystem.get_by_imei(imei), fid=fid, lpos=lpos, ceng=ceng, cdateHistory = [datetime.now()])
				entity = cls(key_name="alarm_%s" % imei, system=db.Key.from_path('DBSystem', "sys_%s" % imei), fid=fid, lpos=lpos, ceng=ceng, cdateHistory = [datetime.now()])
				#memcache.set("inform_%s" % imei, [msg])
				entity.put()
			else:
				entity.cdateHistory.append(datetime.now())
				#memcache.set("inform_%s" % imei, entity.messages)
				entity.put()

			return entity

		return db.run_in_transaction(txn)

	@classmethod
	def getall(cls):
		for r in cls.all():
			usr = ''
			if r.confirmed:
				usr = str(r.confirmby.user)
			yield {
				'skey': str(r.system.key()),
				'dt': r.cdate.strftime("%y%m%d%H%M%S"),
				'lpos': (r.lpos.lat, r.lpos.lon),
				'fid': r.fid,
				'ceng': r.ceng,
				'confirmed': r.confirmed,
				'confirmby': usr,
				'dthistory': [x.strftime("%y%m%d%H%M%S") for x in r.cdateHistory],
				'confirmwhen': (r.confirmwhen or datetime.now()).strftime("%y%m%d%H%M%S") or none
			}
	@classmethod
	def confirm(cls, imei, account):
		entity = cls.get_by_key_name("alarm_%s" % imei)
		if entity is not None:
			entity.confirmed = True
			entity.confirmby = account
			entity.confirmwhen = datetime.now()
			entity.put()

	@classmethod
	def cancel(cls, imei, account):
		entity = cls.get_by_key_name("alarm_%s" % imei)
		if entity is not None:
			db.delete(entity)
