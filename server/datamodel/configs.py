# -*- coding: utf-8 -*-

from google.appengine.ext import db
#from zlib import compress, decompress
import pickle

class DBConfig(db.Model):
	_config = db.BlobProperty(default = pickle.dumps({}))
	_debug = db.TextProperty(default='')

	@classmethod
	def get_by_imei(cls, imei):
		return cls.get_or_insert(str(imei))

	def get_config(self):
		try:
			#configs = eval(decompress(self._config))
			configs = pickle.loads(self._config)
		except:
			configs = {}
		return configs

	def set_config(self, value):
		#self._config = compress(repr(value), 9)
		self._config = pickle.dumps(value)
		self._debug = repr(value)
		#self.put()

	def del_config(self):
		#del self._config
		self._config = None

	config = property(get_config, set_config, del_config, "I'm the 'config' property.")

class DBNewConfig(DBConfig):
	pass

class DBDescription(db.Model):
	name = db.StringProperty(multiline=False)	# имя параметра
	value = db.StringProperty(multiline=False)	# Текстовое описание
	unit = db.StringProperty(multiline=False)	# Единица измерения
	coef = db.FloatProperty(default=1.0)		# Коэффициент преобразования для человеческого представления
	mini = db.IntegerProperty(default=0)		# Минимальное значение для типа INT
	maxi = db.IntegerProperty(default=32767)	# Максимальное значение для типа INT
	private = db.BooleanProperty(default=False)
