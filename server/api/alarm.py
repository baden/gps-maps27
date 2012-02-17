# -*- coding: utf-8 -*-

from core import BaseApi
from google.appengine.api.labs import taskqueue

#
# Подтверждение получения тревожного сообщения
#
class Confirm(BaseApi):
	requred = ('imei')
	def parcer(self):
		from alarm import Alarm
		from inform import Informer
		import urllib

		Informer.add_by_imei(self.imei, 'ALARM_CONFIRM')
		Alarm.confirm(self.imei, self.user)

		#url = "/addlog?imei=%s&text=%s" % (self.imei, u'Получение тревоги подтверждено оператором ' % self.account.user.nickname())
		url = "/addlog?imei=%s&mtype=alarm_confirm&akey=%s" % (self.imei, str(self.akey))
		taskqueue.add(url = url, method="GET", countdown=0)

		return {'answer': 'ok', 'imei': str(self.imei)}

#
# Отмена получения тревожного сообщения
#
class Cancel(BaseApi):
	requred = ('skey')
	def parcer(self):
		from alarm import Alarm
		from inform import Informer
		import urllib

		Informer.add_by_imei(self.skey.name(), 'ALARM_CANCEL')
		Alarm.cancel(self.skey.name(), self.user)

		#url = "/addlog?imei=%s&text=%s" % (self.imei, u'Отбой тревоги оператором ' % self.account.user.nickname())
		#url = "/addlog?imei=%s&text=%s" % (self.imei, urllib.quote(u'Cancel alarm ру'.encode('utf-8')))
		url = "/addlog?imei=%s&mtype=alarm_cancel&akey=%s" % (self.skey.name(), str(self.akey))

		taskqueue.add(url = url, method="GET", countdown=0)

		return {'answer': 'ok', 'imei': str(self.skey.name())}

#
# Запросить список "активных" тревог
#
class Get(BaseApi):
	#requred = ('account')
	def parcer(self):
		from alarm import Alarm
		all = [r for r in Alarm.getall()]
		return {'answer': 'ok', 'alarms': all}
