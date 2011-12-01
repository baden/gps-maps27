# -*- coding: utf-8 -*-

"""
	Механизм записи всех операций.
"""

from google.appengine.ext import db
from namespace import at_local, private

DEFAULT_COLLECT = 'DefaultCollect'

class DBAdmin(db.Model):
	date = db.DateTimeProperty(auto_now_add=True)		# Время совершения операции
	akey = db.StringProperty(multiline=False)		# Ключ пользователя, выполнившего операцию (или пустой ключ если операция не привязана к какому-либо пользователю)
	desc = db.StringProperty(multiline=False)		# Описание выполенного действия
	params = db.StringProperty(multiline=False)		# Представление словаря параметров операции

	@classmethod
	@at_local
	def addOperation(cls, akey, desc, params):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__)
		cls(parent=collect_key, akey=str(akey), desc=desc, params=repr(params)).put()

	"""
		Запросить список последних операций
	"""
	@classmethod
	def lastOperations(cls, **kwds):
		collect_key = db.Key.from_path(DEFAULT_COLLECT, cls.__name__, namespace=private())
		cursor = kwds.pop('cursor', None)
		q = cls.all(namespace=private()).ancestor(collect_key).order('-date')
		if cursor is None:
			return q
		else:
			return q.with_cursor(cursor)
