# -*- coding: utf-8 -*-

from google.appengine.ext import db
from google.appengine.api import memcache
from datetime import datetime, timedelta
from datamodel import DBSystem
import logging

DEFAULT_COLLECT = 'DefaultCollect'

#
#  Используется для отправки системе сообщений.
#  - информирование о смене конфигурации (пока не используется)
#  - подтверждение тревоги для SIM20
#  - отмена тревоги для SIM20
#
class Alarm(db.Model):
	cdate = db.DateTimeProperty(auto_now_add=True)		# Время создания тревоги
	#system = db.ReferenceProperty(DBSystem)		# Система, вызвавшая тревогу - Убрано, вместо этого искользовать key().name()
	cdateHistory = db.ListProperty(datetime, default=None)	# Время создания тревоги
	lpos = db.GeoPtProperty()				# Последняя позиция
	fid = db.IntegerProperty()				# FID
	ceng = db.StringProperty(default='')			# Строка инженерного меню (если есть)
	confirmed = db.BooleanProperty(default=False)		# Получение тревоги подтверждено
	confirmby = db.UserProperty()				# Оператор, подтвердивший тревогу
	#confirmby = db.StringProperty(default=None)		# Оператор, подтвердивший тревогу
	confirmwhen = db.DateTimeProperty()			# Время подтвердения тревоги

	@classmethod
	def add_alarm(cls, imei, fid, lpos, ceng):
		#entity = cls(key_name="alarm_%s" % system.imei, system_key=system)
		#entity.put()
		def txn():
			collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
			entity = cls.get_by_key_name(imei, parent=collect_key)
			if entity is None:
				entity = cls(key_name=imei, parent=collect_key, fid=fid, lpos=lpos, ceng=ceng, cdateHistory = [datetime.now()])
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
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		for r in cls.all().ancestor(collect_key):
			usr = ''
			if r.confirmed:
				usr = confirmby.nickname()
			yield {
				#'skey': str(r.system.key()),
				'skey': str(DBSystem.imei2key(r.key().name())),
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
	def confirm(cls, imei, user):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		entity = cls.get_by_key_name(imei, parent=collect_key)
		if entity is not None:
			entity.confirmed = True
			entity.confirmby = user
			entity.confirmwhen = datetime.now()
			entity.put()

	@classmethod
	def cancel(cls, imei, account):
		key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__, cls.__name__, imei)
		try:
			db.delete(key)
		except:
			logging.warning('Error deleting Alarm: %s' % key)
		pass
