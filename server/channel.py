# -*- coding: utf-8 -*-

import webapp2
import logging
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import channel
import json

from datamodel.accounts import DBAccounts
#import cPickle as pickle
#import pickle

logging.getLogger().setLevel(logging.ERROR)

# В 1.6.0 наблюдаются проблемы с channel api.
DISABLE_CHANNEL = True
#DISABLE_CHANNEL = False

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
	#akey = db.Key.from_path('DBAccounts', user_id)
	akey = DBAccounts.key_from_user_id(user_id)
	logging.info('== Generate channel-token for account: %s, uuid=%s' % (akey, uuid))
	if not DISABLE_CHANNEL:
	    token = channel.create_channel(uuid)
	else:
	    token = 'disabled'
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
			'akey': '%s' % DBAccounts.key_from_user_id(uuid.split('_')[0]),	#db.Key.from_path('DBAccounts', uuid.split('_')[0]),
			'uuid': uuid,
			'token': token
		}

class ChannelConnectHandler(webapp2.RequestHandler):
	def post(self):
		handle_connection(self.request.get('from'))

class ChannelDisconnectHandler(webapp2.RequestHandler):
	def post(self):
		handle_disconnection(self.request.get('from'))

"""
	Для некоторого снятия нагрузки с процедур, требующих передачи сообщений, сам сообщения отправляются с задержкой в 10 секунд.
	Для срочной отправки сообщений когда это нужно необходимо воспользоваться функцией send_instant_message
	Необходимо обязательно фильтровать отправку клиентам по ключам систем. В противном случае "продвинутые" пользователи увидят чужие сообщения
	и смогут даже добавить системы, которые они не видят.
"""

"""
	Типы сообщений:
		broadcast - Сообщение всем подключенным клиентам
		by_skey	- Сообщение всем подключенным клиентам у которых в списке наблюдения присутствует система с заданным ключем (IMEI)
		by_akey - Сообщение всем подключенным клиентам для выбранного пользователя (если на одном компьютере открыть несколько копий приложения)
"""
class DBMessages(db.Model):
	#dest_uuid = db.ListProperty(str, default=None)			# Список адресов - получателей. На данном этапе не используется
	akeys = db.ListProperty(db.Key)				# Заполняется если указан получатель по пользователю
	skeys = db.ListProperty(db.Key)				# Заполняется есдт указан получатель по владению системой
	message = db.TextProperty(default=u"")

def send_message(message, akeys=[], skeys=[], timeout=10):
	from google.appengine.api.labs import taskqueue
	# Для работы в High Replication необходимо все записи разместить в одной сущности.
	collect_key = db.Key.from_path('DefaultCollect', 'DBMessages')
	#messagedb = DBMessages(parent = collect_key, message = pickle.dumps(message, protocol=pickle.HIGHEST_PROTOCOL))
	messagedb = DBMessages(parent = collect_key, akeys=akeys, skeys=skeys, message = repr(message))
	messagedb.put()
	#lazzy_run()
	lazzyrun = memcache.get('DBMessages:lazzy_run')
	if lazzyrun is None:
		memcache.set('DBMessages:lazzy_run', 'wait', time=timeout*2)
		taskqueue.add(url='/channel/message', countdown=timeout)

def inform(msg, skey, data):
	send_message({
		'msg': str(msg),
		'skey': str(skey),
		'data': data
	}, skeys=[skey])

class MessagePost(webapp2.RequestHandler):
	def post(self):
		logging.info('\n\nExecute messages send.\n')
		collect_key = db.Key.from_path('DefaultCollect', 'DBMessages')
		messages_bc = []
		messages_akey = {}
		messages_skey = {}
		mkeys = []
		query = DBMessages.all().ancestor(collect_key)
		for mesg in query:
			logging.info('\n\nMessage: %s' % mesg.message)
			#messages.append(pickle.loads(mesg.message))
			value = eval(mesg.message)
			if (mesg.akeys is not None) and (len(mesg.akeys) > 0):
				logging.info('\n\n+akey')
				for akey in mesg.akeys:
					if akey not in messages_akey:
						messages_akey[akey] = [value]
					else:
						messages_akey[akey].append(value)
			elif (mesg.skeys is not None) and (len(mesg.skeys) > 0):
				logging.info('\n\n+skey')
				for skey in mesg.skeys:
					if skey not in messages_skey:
						messages_skey[skey] = [value]
					else:
						messages_skey[skey].append(value)
			else:
				logging.info('\n\n+broadcast')
				messages_bc.append(value)
			mkeys.append(mesg.key())
			#mesg.delete()

		uuids = memcache.get('DBUpdater:root')
		if uuids is None:
			root = DBUpdater.get_by_key_name('root')
			if root is None:
				uuids = []
			else:
				uuids = root.uuids

		#dump = json.dumps(messages_bc)
		for uuid in uuids:
			_log = '\n\nMessages for: %s\n' % uuid
			# Сообщения по "akey" (асинхронный запрос, мелочь а даст немного экономии)
			#akey = db.Key.from_path('DBAccounts', uuid.split('_')[0])
			akey = DBAccounts.key_from_user_id(uuid.split('_')[0])
			#account_future = DBAccounts.get_async(akey)
			account_future = db.get_async(akey)

			# Сообщения "всем"
			messages = messages_bc[:]
			if len(messages) > 0:
				_log += '\nBroadcast messages: %d\n%s\n' % (len(messages), repr(messages))
			
			# Сообщения по "akey" 
			if akey in messages_akey:
				for msg in messages_akey[akey]:
					messages.append(msg)
					_log += '\nMessage by akey:\n%s\n' % repr(msg)

			account = account_future.get_result()
			skeys = account.systems_key

			# Сообщения по "skey"
			for skey in skeys:
				if skey in messages_skey:
					for msg in messages_skey[skey]:
						messages.append(msg)
						_log += '\nMessage by skey:\n%s\n' % repr(msg)

			if len(messages) > 0:
				try:
					_log += 'Send to client: %s\n' % uuid
					if not DISABLE_CHANNEL:
						channel.send_message(uuid, json.dumps(messages))
				except channel.InvalidChannelClientIdError, e:
					logging.error("Channed error: (%s). TBD! Remove uuid from list." % str(e))
			else:
				_log += 'No messages for client: %s\n' % uuid

			logging.info(_log)

		db.delete(mkeys)
		memcache.delete('DBMessages:lazzy_run')

class Message(BaseApi):
	def parcer(self):
		logging.info('Broadcast message ')
		args = self.request.arguments()
		message = dict((a, self.request.get(a, '')) for a in args)
		send_message(message, skeys=[DBSystem.imei2key('356895035359317')])
		#send_instant_message(message)

		return {
			'answer': 'ok',
			'message': message
		}

#class ChannelErrorHandler(webapp2.RequestHandler):
#	def post(self):
#		#handle_disconnection(self.request.get('from'))
#		pass
