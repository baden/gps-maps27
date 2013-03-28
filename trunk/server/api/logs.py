# -*- coding: utf-8 -*-
from core import BaseApi
import logging

class Get(BaseApi):
	requred = ('skey')
	def parcer(self):
		from datamodel.logs import GPSLogs
		#from time import sleep

		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		cursor = self.request.get("cursor", None)
		if cursor is None:
			q = GPSLogs.all().ancestor(self.skey).order('-date')
		else:
			q = GPSLogs.all().ancestor(self.skey).order('-date').with_cursor(cursor)

		qlen = 25

		logs = [{
				'time': log.date.strftime("%y%m%d%H%M%S"),
				'text': log.text,
				'label': log.label,
				'key': "%s" % log.key()
			} for log in q.fetch(qlen)]

		return {
			'answer': "ok",
			'logs': logs,
			'cursor': q.cursor(),
			'done': len(logs) < qlen
		}

class Del(BaseApi):
	requred = ('skey')
	def parcer(self):
		from datamodel.logs import GPSLogs
		import sys

		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		lkey = self.request.get("lkey", None)
		logging.info('api.logs.del (key=%s)' % lkey)
		#logsq = GPSLogs.all().ancestor(self.skey).order('-date').fetch(1000)
		#GPSLogs.get(lkey).delete()
		try:
			GPSLogs.get(lkey).delete()
			#db.delete(db.Key(lkey))
		except:
			return {
				"answer": "fail",
				"comment": str(sys.exc_info()[0])
			}

		return {
			"answer": "ok",
		}

class Purge(BaseApi):
	requred = ('nologin')
	def parcer(self):
		from google.appengine.ext import db
		from datamodel import DBSystem
		from datamodel.logs import GPSLogs

		imei = self.request.get("imei", None)
		if imei is None:
			return {
				"answer": "error",
				"reason": "require IMEI"
			}
			

		limit = int(self.request.get("limit", "1000"))

		skey = DBSystem.imei2key(imei)
		q = GPSLogs.all(keys_only=True).ancestor(skey).order('-date')


		db.delete(q.fetch(limit))
		'''
		results = q.fetch(limit)
		while results:
		  db.delete(results)
		  results = q.fetch(limit)
		'''
		return {
			"answer": "done",
			"len": q.count()
		}

class Count(BaseApi):
	requred = ('nologin')
	def parcer(self):
		from datamodel import DBSystem
		from datamodel.logs import GPSLogs

		imei = self.request.get("imei", None)
		if imei is None:
			return {
				"answer": "error",
				"reason": "require IMEI"
			}
			
		skey = DBSystem.imei2key(imei)
		q = GPSLogs.all(keys_only=True).ancestor(skey)

		return {
			"answer": "done",
			"len": q.count()
		}
