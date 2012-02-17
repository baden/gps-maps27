# -*- coding: utf-8 -*-
import logging

from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import channel

from accounts import DBAccounts
from namespace import private

# В 1.6.0 наблюдаются проблемы с channel api.
#DISABLE_CHANNEL = True
DISABLE_CHANNEL = False

# Сообщения при поступлении ставятся в очередь и отправляются через указанный интервал. Если в течение этого времени приходит еще сообщение, то при
# отправке они объединяются.
DEFAULT_TIMEOUT = 3

class DBUpdater(db.Model):
	uuids = db.ListProperty(str, default=None)	# Список всех подключенных клиентов, которые наблюдают за этой системой (стек)

"""
	Призвана обеспечить механизм рассылки оповещений подключенным клиентам (открытым страницам).

	Механизм:
	При открытии страницы, запрашивется открытие канала.


	Модель DBUpdater связывает системы (ключ=skey) с открытыми клиентами (поле uuids)
	запись с ключем ('root' содержит список всех подключенных клиентов)
"""

"""
	uuid состоит из трех элементов, разделенных через ':':
	user_id:уникальный_ключ:домен
"""

def register(uuid):
	user_id = uuid.split(':')[0]
	#akey = db.Key.from_path('DBAccounts', user_id)
	akey = DBAccounts.key_from_user_id(user_id)
	logging.warning('== Generate channel-token for account: %s, uuid=%s' % (akey, uuid))
	if not DISABLE_CHANNEL:
	    token = channel.create_channel(uuid)
	else:
	    token = 'disabled'
	return token

def handle_connection(client_id):
	logging.warning('== Connect client: %s' % client_id)
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
	logging.warning('== Disconnect client: %s' % client_id)

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
	skeys = db.ListProperty(db.Key)				# Заполняется если указан получатель по владению системой
	domain = db.StringProperty(default="")			# Заполняется если сообщение должно быть ограничено доменом
	message = db.TextProperty(default=u"")

def send_message(message, akeys=[], skeys=[], domain="", timeout=DEFAULT_TIMEOUT):
	from google.appengine.api.labs import taskqueue

	logging.warning('\n\nExecute: send_message.\n')
	# Для работы в High Replication необходимо все записи разместить в одной сущности.
	collect_key = db.Key.from_path('DefaultCollect', 'DBMessages')
	#messagedb = DBMessages(parent = collect_key, message = pickle.dumps(message, protocol=pickle.HIGHEST_PROTOCOL))
	logging.warning('\n\nRepr: parent:[%s]\nakeys:[%s]\nskeys:[%s]\ndomain:[%s]\nmessage:[%s]' % (repr(collect_key), repr(akeys), repr(skeys), repr(domain), repr(message)))
	messagedb = DBMessages(parent = collect_key, akeys=akeys, skeys=skeys, domain=domain, message = repr(message))
	messagedb.put()
	#lazzy_run()
	lazzyrun = memcache.get('DBMessages:lazzy_run')
	if lazzyrun is None:
		memcache.set('DBMessages:lazzy_run', 'wait', time=timeout*2)
		taskqueue.add(url='/channel/message', countdown=timeout)

def inform(skey, msg, data, domain=""):
	send_message({
		'msg': str(msg),
		'skey': str(skey),
		'data': data
	}, skeys=[skey], domain=domain)

def inform_account(akey, msg, data):
	send_message({
		'msg': str(msg),
		'akey': str(akey),
		'data': data
	}, akeys=[akey], domain=private())
