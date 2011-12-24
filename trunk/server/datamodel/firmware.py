# -*- coding: utf-8 -*-
from google.appengine.ext import db

DEFAULT_COLLECT = 'DefaultCollect'

class DBFirmware(db.Model):
	cdate = db.DateTimeProperty(auto_now_add=True)	# Дата размещения прошивки
	boot = db.BooleanProperty(default=False)	# Устанавливается в True если это образ загрузчика
	hwid = db.IntegerProperty()			# Версия аппаратуры
	swid = db.IntegerProperty()			# Версия прошивки
	subid = db.IntegerProperty(default=0)		# Подверсия аппаратуры (введена из-за 6000ков)
	data = db.BlobProperty()			# Образ прошивки
	size = db.IntegerProperty()			# Размер прошивки (опция)
	desc = db.StringProperty(multiline=True)	# Описание прошивки (опция)

	@classmethod
	def add(cls, data):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		if data['boot']:
			newfw = cls(parent=collect_key, key_name = "FWBOOT%04X" % data['hwid'], desc = u"Загрузчик", boot = True)
		else:
			newfw = cls(parent=collect_key, key_name = "FWGPS%04X%04X%04X" % (data['hwid'], data['swid'], data['subid']), desc = u"Образ ядра")
		newfw.hwid = data['hwid']
		newfw.swid = data['swid']
		newfw.subid = data['subid']
		newfw.data = data['pdata']
		newfw.size = len(data['pdata'])
		newfw.put()

		#return cls.get_or_insert(user.user_id(), user=user, parent=collect_key)


	@classmethod
	def get_all(cls, boot=None, hwid=None, subid=None, swid=None):
		q = cls.all().ancestor(db.Key.from_path(DEFAULT_COLLECT, cls.__name__))
		if boot is not None:
			q.filter('boot =', boot)
		if hwid is not None:
			q.filter('hwid =', hwid)
		if subid is not None:
			q.filter('subid =', subid)
		if swid is not None:
			q.filter('swid =', swid)
		else:
			q.order('-swid')
		return q

	def todict(self):
		return {
			'key': str(self.key()),
			'keyname': self.key().name(),
			'hwid': "%04X" % self.hwid,
			'swid': "%04X" % self.swid,
			'subid': "%d" % self.subid,
			'subidhex': "%04X" % self.subid,
			'cdate': self.cdate,
			'size': self.size,
			'desc': self.desc
		}
