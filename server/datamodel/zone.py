# -*- coding: utf-8 -*-

from google.appengine.ext import db

# Гео-зоны
# parent (ancestor) является администратором зоны (DBAccounts)
class DBZone(db.Model):
	owner = db.UserProperty(auto_current_user_add=True)		# Пользователь, создавший зону
	private = db.BooleanProperty(default=False)			# Если установлено в True, то только пользователь создавший зону может ее видеть
	ztype = db.IntegerProperty(required=True)			# на первом этапе будет поддерживаться только 'polygon'
	points = db.ListProperty(db.GeoPt, default=None)		# Перечень узлов
	options = db.StringListProperty(default=None)			# свойства зоны (цвет, и т.п.)
	name = db.StringProperty(default=u'Задайте имя зоны');
	address = db.StringProperty(default=u'Укажите адрес для зоны');
	boundssw = db.GeoPtProperty()					# Оптимизация поиска вхождения точки
	boundsne = db.GeoPtProperty()

	# Типы зоны
	_POLYGON = 1
	_CIRCLE = 2
	_BOUND = 3

	@classmethod
	def addZone(cls, ztype, points):
		collect_key = db.Key.from_path('DefaultCollect', 'DBZone')
		cls(parent=collect_key, ztype=ztype, points=points).put()

	@classmethod
	def getZones(cls, **kwds):
		collect_key = db.Key.from_path('DefaultCollect', 'DBZone')
		return cls.all().ancestor(collect_key)

	#collect_key = db.Key.from_path('DefaultCollect', 'DBZone')

# Записи связи зон с объектами
# parent (ancestor) указывает на объект (DBSystem)
class DBZoneLink(db.Model):
	#system = db.
	sort = db.IntegerProperty(default=0)		# приоритет правила (для поднятия приоритета указать -1, для уменьшения приоритета указать +1)
	zone = db.ReferenceProperty(DBZone)
	rule = db.IntegerProperty(default=0)		# правило 

