# -*- coding: utf-8 -*-

import os
import webapp2
from webapp2_extras import jinja2
from webapp2_extras import sessions
from google.appengine.api import users
from datamodel.accounts import DBAccounts
from webapp2_extras.users import login_required

import logging

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
		#namespace_manager.set_namespace(os.environ['SERVER_NAME'])

		user = users.get_current_user()
		#self.account = DBAccounts(key_name = "acc_%s" % self.user.user_id())
		#akey = db.Key.from_path('DBAccounts', user.user_id())
		akey = DBAccounts.key_from_user_id(user.user_id())
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
                #account = DBAccounts.get_or_insert(user.user_id(), user=user)
		account = DBAccounts.get_by_user(user)
		template_args['account'] = account
		template_args['akey'] = akey

		# To set a value:
		#self.session['foo'] = 0
		# To get a value:
		#foo = self.session.get('foo')

		self.session['run_counter'] = self.session.get('run_counter', 0) + 1
		logging.info('--------------> Increment session')

		template_args['session'] = self.session
		path = os.path.join(os.path.dirname(__file__), 'templates', filename)
		#logging.info('path=%s', path)
		#with open(path) as f:
		#	for line in f:
		#		logging.info('line:%s', line)
		#		#print line

		#self.response.write(self.jinja2.render_template(path, **template_args))
		#self.jinja2.
		logging.info('Jinja default config (%s)' % repr(jinja2.default_config))
		self.response.write(self.jinja2.render_template(filename, **template_args))


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


class BinBackup(BaseHandler):

	def fix_bin(self, pdata):
		from utils import CRC16
		if ((len(pdata)-2) & 31) != 0:
			while (len(pdata) & 31)!=0:
				pdata += chr(0)
		if (len(pdata) & 31)==0:
			crc = 0
			for byte in pdata:
				crc = CRC16(crc, ord(byte))
			pdata += chr(crc & 0xFF)
			pdata += chr((crc>>8) & 0xFF)
		return pdata

	def get(self):
		from utils import CRC16
		from datamodel import DBGPSBinBackup, DBGPSBin
		from datamodel.system import DBSystem
		#from local import fromUTC
		from datetime import date, datetime, timedelta

		imei = self.request.get('imei')
		#system = DBSystem.get_by_imei(imei)
		skey = DBSystem.key_by_imei(imei)
		#if system is None

		cmd = self.request.get('cmd')
		total = 0
		if cmd:
			ukey = self.request.get('key')
			if cmd == 'getbin':
				self.response.headers['Content-Type'] = 'application/octet-stream'
				bindata = db.get(db.Key(ukey))
				pdata = self.fix_bin(bindata.data)

				self.response.out.write(pdata)
				return
			elif cmd == 'fixcrc':
				bindata = db.get(db.Key(ukey))
				pdata = self.fix_bin(bindata.data)
				if pdata != bindata.data:
					bindata.data = pdata
					bindata.put()
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'fixlen':
				bindata = db.get(db.Key(ukey))
				pdata = bindata.data
				while (len(pdata) & 31)!=0: pdata += chr(0)
					
				crc = 0
				for byte in pdata:
					crc = CRC16(crc, ord(byte))
				pdata += chr(crc & 0xFF)
				pdata += chr((crc>>8) & 0xFF)
				bindata.data = pdata
				bindata.put()
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'del':
				db.delete(db.Key(ukey))
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'delall':
				dbbindata = DBGPSBinBackup.all(keys_only=True).order('cdate').ancestor(skey).fetch(500)
				if dbbindata:
					db.delete(dbbindata)
				self.redirect("/binbackup?imei=%s" % imei)
				return
			elif cmd == 'delold':
				dbbindata = DBGPSBinBackup.all(keys_only=True).filter("cdate <=", datetime.utcnow()-timedelta(days=30)).order('cdate').fetch(500)
				if dbbindata:
					db.delete(dbbindata)
				self.redirect("/binbackup")
				return
			elif cmd == 'pack':
				self.response.headers['Content-Type'] = 'application/octet-stream'
				pdata = ''
				cfilter = self.request.get('filter')
				cnt = self.request.get('cnt')
				count = 500
				if cnt: count = int(cnt)
				today = date.today()
				aftercdate = self.request.get('after')
				asc = self.request.get('asc', 'None')

				if cfilter:
					dbbindata = DBGPSBinBackup.all().filter('cdate >=', today).order('-cdate').ancestor(skey).fetch(count)
				else:
					if aftercdate and aftercdate!="None":
						if asc == 'yes':
							dbbindata = DBGPSBinBackup.all().filter("cdate >", datetime.strptime(aftercdate, "%Y%m%d%H%M%S") + timedelta(seconds = 1)).order('cdate').ancestor(skey).fetch(count)
						else:
							dbbindata = DBGPSBinBackup.all().filter("cdate >", datetime.strptime(aftercdate, "%Y%m%d%H%M%S") + timedelta(seconds = 1)).order('-cdate').ancestor(skey).fetch(count)
					else:
						if asc == 'yes':
							dbbindata = DBGPSBinBackup.all().order('cdate').ancestor(skey).fetch(count)
						else:
							dbbindata = DBGPSBinBackup.all().order('-cdate').ancestor(skey).fetch(count)

				for bindata in dbbindata:
					if bindata.crcok:
						npdata = bindata.data
						#bindata.datasize = len(npdata)
						if npdata[0] == 'P':	# POST-bug
							continue

						if (len(npdata) & 31)==0:
							pdata += npdata
						else:
							if ((len(npdata)-2) & 31) == 0:
								pdata += npdata[:-2]
							else:
								while (len(npdata) & 31)!=0: npdata += chr(0)
								pdata += npdata

				logging.info("Packets: %d" % len(dbbindata))
				if len(pdata) == 0:
					self.response.headers["BinData"] = "None"
					return

				self.response.headers["BinData"] = "Present"
				crc = 0
				for byte in pdata:
					crc = CRC16(crc, ord(byte))
				pdata += chr(crc & 0xFF)
				pdata += chr((crc>>8) & 0xFF)
				"""
				crc = ord(pdata[-1])*256 + ord(pdata[-2])
				pdata = pdata[:-2]
				_log += '\n==\tData size: %d' % len(pdata)

				"""

				if len(dbbindata) > 0:
					if asc == 'yes':
						self.response.headers["lastcdate"] = "%s" % dbbindata[-1].cdate.strftime("%Y%m%d%H%M%S")
					else:
						self.response.headers["lastcdate"] = "%s" % dbbindata[0].cdate.strftime("%Y%m%d%H%M%S")

				self.response.out.write(pdata)
				return
			elif cmd == 'parce':
				bindata = db.get(db.Key(ukey))
				pdata = bindata.data[:-2]
				#pdata = pdata[:-2]
				"""
				if ((len(pdata)-2) & 31) != 0:
					while (len(pdata) & 31)!=0:
						pdata += chr(0)
				if (len(pdata) & 31)==0:
					crc = 0
					for byte in pdata:
						crc = CRC16(crc, ord(byte))
					pdata += chr(crc & 0xFF)
					pdata += chr((crc>>8) & 0xFF)
				"""
				dataid = 0

				newbin = DBGPSBin(parent = system)
				newbin.dataid = dataid
				newbin.data = pdata #db.Text(pdata)
				newbin.put()

				url = "/bingps/parse?dataid=%s&key=%s" % (dataid, newbin.key())
				#taskqueue.add(url = url % self.key().id(), method="GET", countdown=countdown)
				countdown=0
				taskqueue.add(url = url, method="GET", countdown=countdown)

				cursor = self.request.get('cursor')
				if cursor:
					self.redirect("/binbackup?imei=%s&cursor=%s" % (imei, cursor))
				else:
					self.redirect("/binbackup?imei=%s" % imei)

		if skey:
			q = DBGPSBinBackup.all().order('-cdate').ancestor(skey)

			cursor = self.request.get('cursor')
			if cursor:
				q.with_cursor(cursor)

			dbbindata = q.fetch(100)

			for bindata in dbbindata:
				bindata.datasize = len(bindata.data)
				if (bindata.datasize & 31)==0:
					bindata.needfix = True
					bindata.wronglen = False
					total += bindata.datasize
				else:
					bindata.needfix = False
					total += bindata.datasize - 2

					if ((bindata.datasize-2) & 31)!=0:
						bindata.wronglen = True
					else:
						bindata.wronglen = False

				if bindata.data[0] == 'P':
					bindata.postbug = True
				else:
					bindata.postbug = False

				bindata.sdate = bindata.cdate	#.strftime("%d/%m/%Y %H:%M:%S")
			total += 2
			allusers = None

			self.response.headers['Content-Type'] = 'text/html'
			#self.write_template({
			template_args = {
				'imei': imei,
				'dbbindata': dbbindata,
				'cursor': cursor,
				'ncursor': q.cursor(),
				'total': total,
				'skey': skey,
				'allusers': allusers
			}
			self.render_template(self.__class__.__name__ + '.html', **template_args)
			return

		else:
			dbbindata = None
			allusers = DBSystem.all().fetch(500)
			qoldest = DBGPSBinBackup.all().order('cdate').fetch(1)
			if qoldest:
				oldest = qoldest[0].cdate
			else:
				oldest = u"нет записей"
			coldest = DBGPSBinBackup.all(keys_only=True).filter("cdate <=", datetime.utcnow()-timedelta(days=30)).order('cdate').count()

		#template_values = {}
		#template_values['imei'] = uimei
		#template_values['dbbindata'] = dbbindata

		self.response.headers['Content-Type'] = 'text/html'
		#path = os.path.join(os.path.dirname(__file__), 'templates', self.__class__.__name__ + '.html')
		#self.response.out.write(template.render(path, template_values))
		#self.write_template({
		template_args = {
			'imei': imei,
			'dbbindata': dbbindata,
			'total': total,
			'skey': skey,
			'allusers': allusers,
			'oldest': oldest,
			'coldest': coldest,
		}

		self.render_template(self.__class__.__name__ + '.html', **template_args)
