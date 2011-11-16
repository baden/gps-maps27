# -*- coding: utf-8 -*-

import webapp2
import logging
import os

from google.appengine.ext import db
from google.appengine.api import users
from webapp2_extras import jinja2
from webapp2_extras import sessions
from webapp2_extras.users import login_required
from datetime import date, timedelta, datetime

from datamodel.accounts import DBAccounts
from google.appengine.api import namespace_manager

SERVER_NAME = os.environ['SERVER_NAME']
VERSION = '0'
if 'CURRENT_VERSION_ID' in os.environ: VERSION = os.environ['CURRENT_VERSION_ID'] + '/2'
"""
class TemplatedPage(RequestHandler):
	def __init__(self):
		self.user = users.get_current_user()
		if self.user == None:
			self.accounts = None
			return

		self.account = DBAccounts.get_by_key_name("acc_%s" % self.user.user_id())

		if self.account is None:
			self.account = DBAccounts(key_name = "acc_%s" % self.user.user_id())
			self.account.user = self.user
			self.account.put()

	def write_template(self, values, alturl=None):
		if self.user:
			#url = users.create_logout_url(self.request.uri)
			login_url = users.create_login_url(self.request.uri)
			values['login_url'] = login_url
			values['now'] = datetime.utcnow()
			values['username'] = self.user.nickname()
			values['admin'] = users.is_current_user_admin()
			values['server_name'] = SERVER_NAME
			values['uid'] = self.user.user_id()
			values['account'] = self.account

			values['environ'] = os.environ
			values['version'] = VERSION

			if alturl:
				path = os.path.join(os.path.dirname(__file__), 'templates', alturl)
			else:
				path = os.path.join(os.path.dirname(__file__), 'templates', self.__class__.__name__ + '.html')
			self.response.write(template.render(path, values))
		else:
			self.redirect(users.create_login_url(self.request.uri))
"""
class BaseHandler(webapp2.RequestHandler):
	@webapp2.cached_property
	def jinja2(self):
		return jinja2.get_jinja2(app=self.app)

	def dispatch(self):
		# Get a session store for this request.
		self.session_store = sessions.get_store(request=self.request)

		try:
			# Dispatch the request.
			webapp2.RequestHandler.dispatch(self)
		finally:
			# Save all sessions.
			self.session_store.save_sessions(self.response)

	@webapp2.cached_property
	def session(self):
		# Returns a session using the default cookie key.
		return self.session_store.get_session()

	def render_template(self, filename, **template_args):
		namespace = namespace_manager.get_namespace()
		try:
			#namespace_manager.set_namespace(os.environ['SERVER_NAME'])

			user = users.get_current_user()
			#self.account = DBAccounts(key_name = "acc_%s" % self.user.user_id())
			akey = db.Key.from_path('DBAccounts', user.user_id())
			template_args['login_url'] = users.create_login_url(self.request.uri)
			template_args['logout_url'] = users.create_logout_url(self.request.uri)
			template_args['admin'] = users.is_current_user_admin()
			#template_args['server_name'] = SERVER_NAME
			template_args['server_name'] = os.environ['SERVER_NAME']
			template_args['user'] = user

			template_args['environ'] = os.environ
			template_args['version'] = VERSION

			#account = DBAccounts.get(akey)
			#if account is None:
			#	account = DBAccounts(user.user_id(), user=user)
	                account = DBAccounts.get_or_insert(user.user_id(), user=user)
			template_args['account'] = account
			template_args['akey'] = akey

			# To set a value:
			#self.session['foo'] = 0
			# To get a value:
			#foo = self.session.get('foo')

			self.session['run_counter'] = self.session.get('run_counter', 0) + 1
			logging.info('--------------> Increment session')

			template_args['session'] = self.session

			self.response.write(self.jinja2.render_template(filename, **template_args))
		finally:
			namespace_manager.set_namespace(namespace)


class MainPage(BaseHandler):
	@login_required
	def get(self):
		template_args = {}
		self.render_template(self.__class__.__name__ + '.html', **template_args)

class TestMainPage(BaseHandler):
	@login_required
	def get(self):
		template_args = {}
		self.render_template(self.__class__.__name__ + '.html', **template_args)

class TestMain2(BaseHandler):
	@login_required
	def get(self):
		template_args = {}
		self.render_template(self.__class__.__name__ + '.html', **template_args)


#config = {}
#config['webapp2_extras.sessions'] = {
#    'secret_key': 'my-super-secret-key-000',
#}

#app = webapp2.WSGIApplication([
#	('/test.*', TestPage),
#	('/', MainPage),
#], debug=True, config=config)
