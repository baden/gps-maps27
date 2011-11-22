# -*- coding: utf-8 -*-

import webapp2

class TestPage(webapp2.RequestHandler):
	def get(self):
		self.response.write('Hello, test!')
