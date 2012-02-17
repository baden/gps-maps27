# -*- coding: utf-8 -*-
from core import BaseApi
from google.appengine.ext import db

class Desc(BaseApi):
	def parcer(self):
		from datamodel.configs import DBDescription

		name = self.request.get('name', '-error-')
		collect_key = db.Key.from_path('DefaultCollect', 'DBDescription')
		DBDescription(key_name = str(name), name=name, parent=collect_key, value=self.request.get('value', '')).put()
		return {'result': 'ok'}
