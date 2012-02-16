# -*- coding: utf-8 -*-
import os
import logging
import zipfile
from datetime import datetime, timedelta
import webapp2

#logging.getLogger().setLevel(logging.WARNING)

TYPES = {
	'js': 'application/x-javascript',
	'html': 'text/html; charset=utf-8',
	'css': 'text/css',
	'gif': 'image/gif',
	'jpg': 'image/jpeg',
	'jpeg': 'image/jpeg',
	'png': 'image/png',
	'svg': 'image/svg+xml',
}

class MainPage(webapp2.RequestHandler):
	def get(self):
		path = self.request.path[9:]
		archive = path.split("/")[0]
		filename = path[len(archive)+1:]
		ext = path.split(".")[-1]
		if ext in TYPES:
			content_type = TYPES[ext]
		else:
			content_type = "text/plain"

		zipfilename = os.path.join(os.path.dirname(__file__), 'plugins', archive  + '.zip')

		log = "Archive: %s\nZip-file: %s\nFile: %s\nExt: %s\nContent-type: %s\n" % (archive, zipfilename, filename, ext, content_type)

		"""
		if zipfile.is_zipfile(zipfilename):
			log += "File is zip.\n"
		else:
			log += "File not a zip.\n"
		"""

		fileout = ""
		try:
			myzip = zipfile.ZipFile(zipfilename, 'r')
		except:
			logging.error("Archive %s is not found." % zipfilename)
			self.error(404)
			return

		try:
			info = myzip.getinfo(filename)
		except KeyError:
			logging.error("File %s is not found in archive %s." % (filename, zipfilename))
			self.error(404)
			return

		fileout += myzip.read(filename)
		myzip.close()

		log += "File size: %d\n" % len(fileout)

		logging.info(log)

		self.response.headers['Content-Type'] = content_type

		expires_date = datetime.utcnow() + timedelta(365)
		expires_str = expires_date.strftime("%d %b %Y %H:%M:%S GMT")
		self.response.headers.add_header("Expires", expires_str)

		#self.response.headers.add_header('Cache-Control', 'public, max-age=86400')
		self.response.headers['Cache-Control'] = 'public, max-age=86400'
		self.response.write(fileout)
