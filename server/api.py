# -*- coding: utf-8 -*-
#from webapp2 import WSGIApplication, RequestHandler
import webapp2
import json
import logging
from datamodel.accounts import DBAccounts
from google.appengine.ext import db

logging.getLogger().setLevel(logging.DEBUG)

API_VERSION = 1.27

class BaseApi(webapp2.RequestHandler):
	requred = ()
	def parcer(self):
		return {'answer': 'no', 'reason': 'base api'}

	def _parcer(self):
		if 'account' in self.requred:
			self.akey = self.request.get('akey', None)
			if self.akey is None:
				return {"answer": "no", "reason": "akey not defined or None"}

			try:
				self.account = DBAccounts.get(db.Key(self.akey))
			except db.datastore_errors.BadKeyError, e:
				return {'answer': 'no', 'reason': 'account key error', 'comments': '%s' % e}

			if self.account is None:
				return {'answer': 'no', 'reason': 'account not found'}

		if 'skey' in self.requred:
			skey = self.request.get("skey", None)
			logging.info(skey)
			if skey is None:
				return {'answer': 'no', 'reason': 'skey not defined or None'}
			try:
				self.skey = db.Key(skey)
			except db.datastore_errors.BadKeyError, e:
				return {'answer': 'no', 'reason': 'skey key error', 'comments': '%s' % e}

		if 'imei' in self.requred:
			self.imei = self.request.get('imei', None)
			if self.imei is None:
				return {'answer': 'no', 'result': 'imei not defined'}


		return self.parcer()

	def get(self):
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		self.response.write(json.dumps(self._parcer(), indent=2) + "\r")

	def post(self):
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		self.response.out.write(json.dumps(self._parcer(), indent=2) + "\r")

class Version(BaseApi):
	def parcer(self):
		return {'answer': 'ok', 'version': API_VERSION}

class ApiPage(webapp2.RequestHandler):
	def get(self):
		a = {'a': 1, 'b': 3}
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		self.response.write(json.dumps(a, indent=2) + "\r")

