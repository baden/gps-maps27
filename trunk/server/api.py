# -*- coding: utf-8 -*-
from webapp2 import WSGIApplication, RequestHandler
import json

class ApiPage(RequestHandler):
	def get(self):
		a = {'a': 1, 'b': 2}
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
		self.response.out.write(json.dumps(a, indent=2) + "\r")

app = WSGIApplication([
	('/api/.*', ApiPage),
], debug=True)
