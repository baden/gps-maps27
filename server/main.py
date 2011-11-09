# -*- coding: utf-8 -*-

#import webapp2
from webapp2 import WSGIApplication, RequestHandler
#from api import ApiPage
#from google.appengine.ext.webapp.util import run_wsgi_app
#class MainPage(webapp2.RequestHandler):
import logging
import os

from google.appengine.api.labs import taskqueue

class BinGps(RequestHandler):
	def post(self):
		import os
		os.environ['CONTENT_TYPE'] = "application/octet-stream"		# Патч чтобы SIMCOM мог слать сырые бинарные данные
		self.response.headers['Content-Type'] = 'text/plain'

		_log = 'POST PAGE 1:\n'
		_log += "arguments: %s\n" % self.request.arguments()
		_log += "body len: %s\n" % len(self.request.body)
		_log += 'BODY:'
		_log += self.request.body
		_log += '\n'

		for k,v in os.environ.items():
			_log += "\n==\t%s = %s" % (str(k), str(v))
		logging.info(_log)



#app = webapp2.WSGIApplication([('/', MainPage)],
app = WSGIApplication([
	#('/api/.*', ApiPage),
	('/bingps.*', BinGps),
], debug=True)


#def main():
#    run_wsgi_app(app)

#if __name__ == '__main__':
#    main()
