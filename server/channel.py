# -*- coding: utf-8 -*-

import webapp2
import logging
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import channel
import json

"""
	Призвана обеспечить механизм рассылки оповещений подключенным клиентам (открытым страницам).

	Механизм:
	При открытии страницы, запрашивется открытие канала.


	Модель DBUpdater связывает системы (ключ=skey) с открытыми клиентами (поле uuids)
	запись с ключем ('root' содержит список всех подключенных клиентов)
"""

class DBUpdater(db.Model):
	uuids = db.ListProperty(str, default=None)	# Список всех подключенных клиентов, которые наблюдают за этой системой (стек)

def register(uuid):
	user_id = uuid.split('_')[0]
	akey = db.Key.from_path('DBAccounts', user_id)
	logging.info('== Generate channel-token for account: %s, uuid=%s' % (akey, uuid))
	token = channel.create_channel(uuid)
	return token

def handle_connection(client_id):
	logging.info('== Connect client: %s' % client_id)
	def txn():
		root = DBUpdater.get_by_key_name('root')
		if root is None:
			root = DBUpdater(key_name='root', uuids=[client_id])
			memcache.set('DBUpdater:root', root.uuids)
			root.put()
		else:
			if client_id not in root.uuids:
				root.uuids.append(client_id)
				memcache.set('DBUpdater:root', root.uuids)
				root.put()
	db.run_in_transaction(txn)


def handle_disconnection(client_id):
	logging.info('== Disconnect client: %s' % client_id)

	def txn():
		root = DBUpdater.get_by_key_name('root')
		if root is not None:
			if client_id in root.uuids:
				root.uuids.remove(client_id)
				memcache.set('DBUpdater:root', root.uuids)
				root.put()
	db.run_in_transaction(txn)

	#q = model.Subscription.all().filter('client_id =', client_id)
	#subscriptions = q.fetch(1000)
	#for sub in subscriptions:
	#	prospective_search.unsubscribe(model.RequestRecord, str(sub.key()))
	#db.delete(subscriptions)

from api import BaseApi
class Chanel_GetToken(BaseApi):
	#requred = ('account')
	def parcer(self):
		#import updater

		uuid = self.request.get("uuid")
		if uuid is None:
			return {'answer': 'no', 'reason': 'uuid not defined or None'};

		token = register(uuid)

		logging.info('== Goted token %s ' % token)

		return {
			'answer': 'ok',
			'akey': '%s' % db.Key.from_path('DBAccounts', uuid.split('_')[0]),
			'uuid': uuid,
			'token': token
		}

class ChannelConnectHandler(webapp2.RequestHandler):
	def post(self):
		handle_connection(self.request.get('from'))

class ChannelDisconnectHandler(webapp2.RequestHandler):
	def post(self):
		handle_disconnection(self.request.get('from'))

class Message(BaseApi):
	def parcer(self):
		logging.info('Broadcast message ')
		args = self.request.arguments()
		message = dict((a, self.request.get(a, '')) for a in args)

		uuids = memcache.get('DBUpdater:root')
		if uuids is None:
			root = DBUpdater.get_by_key_name('root')
			if root is None:
				uuids = []
			else:
				uuids = root.uuids

		for uuid in uuids:
			try:
				channel.send_message(uuid, json.dumps(message))
			except channel.InvalidChannelClientIdError, e:
				logging.error("Channed error: (%s). TBD! Remove uuid from list." % str(e))
				#handle_disconnection(uuid)

		return {
			'answer': 'ok',
			'message': message,
			'uuids': uuids
		}

#class ChannelErrorHandler(webapp2.RequestHandler):
#	def post(self):
#		#handle_disconnection(self.request.get('from'))
#		pass
