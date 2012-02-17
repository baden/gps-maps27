# -*- coding: utf-8 -*-
from core import BaseApi

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
		
		#logsq = GPSLogs.all().ancestor(self.skey).order('-date').fetch(1000)
		#GPSLogs.get(lkey).delete()
		try:
			db.delete(db.Key(lkey))
		except:
			return {
				"answer": "fail",
				"comment": str(sys.exc_info()[0])
			}

		return {
			"answer": "ok",
		}
