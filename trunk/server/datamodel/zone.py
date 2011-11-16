# -*- coding: utf-8 -*-

from google.appengine.ext import db

# Гео-зоны
# parent (ancestor) является администратором зоны (DBAccounts)
class DBZone(db.Model):
	ztype = db.StringProperty(required=True, choices=set(["poligon", "circle", "bound"]))	# на первом этапе будет поддерживаться только 'poligon'
	points = db.ListProperty(db.GeoPt, default=None)			# Перечень узлов
	options = db.StringListProperty(default=None)				# свойства зоны (цвет, и т.п.)
	name = db.StringProperty(default=u'Задайте имя зоны');
	address = db.StringProperty(default=u'Укажите адрес для зоны');
	boundssw = db.GeoPtProperty()						# Оптимизация поиска вхождения точки
	boundsne = db.GeoPtProperty()

# Записи связи зон с объектами
# parent (ancestor) указывает на объект (DBSystem)
class DBZoneLink(db.Model):
	#system = db.
	sort = db.IntegerProperty(default=0)		# приоритет правила (для поднятия приоритета указать -1, для уменьшения приоритета указать +1)
	zone = db.ReferenceProperty(DBZone)
	rule = db.IntegerProperty(default=0)		# правило 

