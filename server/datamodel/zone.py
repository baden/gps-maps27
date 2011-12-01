# -*- coding: utf-8 -*-

from google.appengine.ext import db
from namespace import at_local, private

ZTYPE_TO_INT = {
	'polygon': 1,
	'circle': 2,
	'rectangle': 3,
	'polyline': 4,
}

INT_TO_ZTYPE = {
	1: 'polygon',
	2: 'circle',
	3: 'rectangle',
	4: 'polyline'
}

DEFAULT_COLLECT = 'DefaultCollect'

# Гео-зоны
# parent (ancestor) является администратором зоны (DBAccounts)
class DBZone(db.Model):
	owner = db.UserProperty(auto_current_user_add=True)		# Пользователь, создавший зону
	private = db.BooleanProperty(default=False)			# Если установлено в True, то только пользователь создавший зону может ее видеть
	ztype = db.IntegerProperty(required=True)			# 
	points = db.ListProperty(db.GeoPt, default=None)		# Перечень узлов
	radius = db.FloatProperty(default=0.0)				# Радиус в метрах для зоны CIRCLE
	options = db.StringListProperty(default=None)			# свойства зоны (цвет, и т.п.)
	name = db.StringProperty(default=u'Задайте имя зоны');
	address = db.StringProperty(default=u'Укажите адрес для зоны');
	boundssw = db.GeoPtProperty()					# Оптимизация поиска вхождения точки
	boundsne = db.GeoPtProperty()

	# Типы зоны
	_POLYGON = 1
	_CIRCLE = 2
	_RECTANGLE = 3
	_POLYLINE = 4

	@classmethod
	@at_local
	def addZone(cls, ztype, raw_points, zkey=None, bounds=[[0.0, 0.0], [0.0, 0.0]]):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		try:
			ztype = ZTYPE_TO_INT[ztype]
		except:
			ztype = 0

		radius = 0.0
		if ztype == cls._CIRCLE:
			radius = raw_points.pop()[0]

		points = [db.GeoPt(lat=p[0], lon=p[1]) for p in raw_points]

		if zkey is None:
			z = cls(parent=collect_key, ztype=ztype, points=points, radius=radius, boundssw=db.GeoPt(lat=bounds[0][0], lon=bounds[0][1]), boundsne=db.GeoPt(lat=bounds[1][0], lon=bounds[1][1]))
			z.put()
			return z.key()
		else:
			def txn(zkey):
				z = cls.get(db.Key(zkey))
				z.ztype=ztype
				z.points=points
				z.radius=radius
				z.boundssw=db.GeoPt(lat=bounds[0][0], lon=bounds[0][1])
				z.boundsne=db.GeoPt(lat=bounds[1][0], lon=bounds[1][1])
				z.put()
				return z.key()

			return db.run_in_transaction(txn, zkey)

	# db.GeoPt(lat=p[0], lon=p[1])
	#@at_local
	@classmethod
	def getZones(cls, **kwds):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__, namespace=private())
		return cls.all(namespace=private()).ancestor(collect_key)

	@property
	def ztype_name(self):
		try:
			_ztype_name = INT_TO_ZTYPE[self.ztype]
		except:
			_ztype_name = 'unknown'
		return _ztype_name



# Записи связи зон с объектами
# parent (ancestor) указывает на объект (DBSystem)
class DBZoneLink(db.Model):
	#system = db.
	sort = db.IntegerProperty(default=0)		# приоритет правила (для поднятия приоритета указать -1, для уменьшения приоритета указать +1)
	zone = db.ReferenceProperty(DBZone)
	rule = db.IntegerProperty(default=0)		# правило 

