# -*- coding: utf-8 -*-

"""
	Механизм записи всех операций.
"""

from google.appengine.ext import db

class DBAdmin(db.Model):
	date = db.DateTimeProperty(auto_now_add=True)		# Время совершения операции
	akey = db.StringProperty(multiline=False)		# Ключ пользователя, выполнившего операцию (или пустой ключ если операция не привязана к какому-либо пользователю)
	desc = db.StringProperty(multiline=False)		# Описание выполенного действия
	params = db.StringProperty(multiline=False)		# Представление словаря параметров операции

	@classmethod
	def addOperation(cls, akey, desc, params):
		collect_key = db.Key.from_path('DefaultCollect', 'DBAdmin')
		cls(parent=collect_key, akey=str(akey), desc=desc, params=repr(params)).put()

	"""
		Запросить список последних операций
	"""
	@classmethod
	def lastOperations(cls, **kwds):
		collect_key = db.Key.from_path('DefaultCollect', 'DBAdmin')
		cursor = kwds.pop('cursor', None)
		q = cls.all().ancestor(collect_key).order('-date')
		if cursor is None:
			return q
		else:
			return q.with_cursor(cursor)
