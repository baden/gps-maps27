# -*- coding: utf-8 -*-

#import webapp2
from webapp2 import WSGIApplication, RequestHandler
import logging
import os

from google.appengine.api.labs import taskqueue

class MainPage(RequestHandler):
	def get(self):
		#import os
		self.response.write('Hello!')

#app = webapp2.WSGIApplication([('/', MainPage)],
app = WSGIApplication([
	#('/api/.*', ApiPage),
	('/.*', MainPage),
], debug=True)
