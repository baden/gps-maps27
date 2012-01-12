# -*- coding: utf-8 -*-

import webapp2
import logging
import json
import os

from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import channel
from datamodel.accounts import DBAccounts
from datamodel.channel import DBUpdater, DBMessages, DISABLE_CHANNEL, register, handle_connection, handle_disconnection, send_message

logging.getLogger().setLevel(logging.WARNING)

from api import BaseApi

class Chanel_GetToken(BaseApi):
	#requred = ('account')
	def parcer(self):
		uuid = self.request.get("uuid")
		if uuid is None:
			return {'answer': 'no', 'reason': 'uuid not defined or None'};

		token = register(self.user.user_id() + ':' + uuid + ':' + os.environ['SERVER_NAME'])

		logging.warning('== Goted token %s ' % token)

		return {
			'answer': 'ok',
			#'akey': '%s' % DBAccounts.key_from_user_id(uuid.split('_')[0]),	#db.Key.from_path('DBAccounts', uuid.split('_')[0]),
			'uuid': uuid,
			'token': token
		}

class ChannelConnectHandler(webapp2.RequestHandler):
	def post(self):
		handle_connection(self.request.get('from'))

class ChannelDisconnectHandler(webapp2.RequestHandler):
	def post(self):
		handle_disconnection(self.request.get('from'))


class MessagePost(webapp2.RequestHandler):
	def post(self):
		logging.warning('Execute: messages post.')
		collect_key = db.Key.from_path('DefaultCollect', 'DBMessages')
		messages_bc = []
		messages_akey = {}
		messages_skey = {}
		mkeys = []
		query = DBMessages.all().ancestor(collect_key)
		for mesg in query:
			logging.warning('Message: %s' % mesg.message)
			#messages.append(pickle.loads(mesg.message))
			value = eval(mesg.message)
			if (mesg.akeys is not None) and (len(mesg.akeys) > 0):
				logging.info('\n\n+akey')
				for akey in mesg.akeys:
					if akey not in messages_akey:
						messages_akey[akey] = [(value, mesg.domain)]
					else:
						messages_akey[akey].append((value, mesg.domain))
			elif (mesg.skeys is not None) and (len(mesg.skeys) > 0):
				logging.warning('\n\n+skey')
				for skey in mesg.skeys:
					if skey not in messages_skey:
						messages_skey[skey] = [(value, mesg.domain)]
					else:
						messages_skey[skey].append((value, mesg.domain))
			else:
				logging.warning('\n\n+broadcast')
				messages_bc.append((value, mesg.domain))
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
		olduuids = []
		for uuid in uuids:
			_log = 'Messages for: %s\n' % uuid
			# Сообщения по "akey" (асинхронный запрос, мелочь а даст немного экономии)
			#akey = db.Key.from_path('DBAccounts', uuid.split('_')[0])
			parts = uuid.split(':')		# user_id:uniq:domain
			try:
				akey = DBAccounts.key_from_user_id(parts[0], domain=parts[2])
			except:
				logging.error('Error parce uuid. (uuid=%s)' % uuid)
				olduuids.append(uuid)
				continue
				
			#account_future = DBAccounts.get_async(akey)
			account_future = db.get_async(akey)

			# Сообщения "всем"
			#messages = messages_bc[:]
			messages = [m[0] for m in messages_bc if (m[1]=='') or (m[1]==parts[2])]
			if len(messages) > 0:
				_log += '\nBroadcast messages: %d\n%s\n' % (len(messages), repr(messages))
			
			# Сообщения по "akey"  TBD! Нет проверки домена!!!
			if akey in messages_akey:
				for msg in messages_akey[akey]:
					if (msg[1] == '') or (msg[1] == parts[2]):
						messages.append(msg[0])
					_log += '\nMessage by akey:\n%s\n' % repr(msg)

			logging.warning('uuid: %s, akey: %s (%s)' %(uuid, uuid.split('_')[0], str(akey)))

			account = account_future.get_result()
			if account is None:
				logging.error('Error accont. (uuid=%s)' % uuid)
				olduuids.append(uuid)
				continue
			
			skeys = account.systems_key

			# Сообщения по "skey"
			for skey in skeys:
				if skey in messages_skey:
					for msg in messages_skey[skey]:
						if (msg[1] == '') or (msg[1] == parts[2]):
							messages.append(msg[0])
							logging.warning('  ==  Append %s:%s' % (repr(msg), repr(parts)))
						else:
							logging.warning('  ==  Ignore %s:%s' % (repr(msg), repr(parts)))
						_log += '\nMessage by skey:\n%s\n' % repr(msg)

			if len(messages) > 0:
				try:
					_log += 'Send to client: %s\n' % uuid
					if not DISABLE_CHANNEL:
						channel.send_message(uuid, json.dumps(messages))
					_log += 'Send successful.\n'
				except channel.InvalidChannelClientIdError, e:
					logging.error("Channed error: (%s). TBD! Remove uuid from list." % str(e))
					olduuids.append(uuid)
			else:
				_log += 'No messages for client: %s\n' % uuid

			logging.warning(_log)

		if len(olduuids)>0:
			root = DBUpdater.get_by_key_name('root')
			for i in olduuids:
				root.uuids.remove(i)
			root.put()
			memcache.set('DBUpdater:root', root.uuids)
		"""
		uuids = memcache.get('DBUpdater:root')
		if uuids is None:
			root = DBUpdater.get_by_key_name('root')
			if root is None:
				uuids = []
			else:
				uuids = root.uuids
					
		"""

		db.delete(mkeys)
		memcache.delete('DBMessages:lazzy_run')

class Message(BaseApi):
	def parcer(self):
		from datamodel import DBSystem
		logging.warning('Broadcast message ')
		args = self.request.arguments()
		message = dict((a, self.request.get(a, '')) for a in args)
		#send_message(message, skeys=[DBSystem.imei2key('356895035359317')])
		send_message(message)

		return {
			'answer': 'ok',
			'message': message
		}

#class ChannelErrorHandler(webapp2.RequestHandler):
#	def post(self):
#		#handle_disconnection(self.request.get('from'))
#		pass
