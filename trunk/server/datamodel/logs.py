# -*- coding: utf-8 -*-

from google.appengine.ext import db

"""
	События не привязанные точно ко времени (включения/выключения, получение/выполнение SMS-команд и т.д.)
"""
class GPSLogs(db.Model):
	text = db.StringProperty(multiline=True)
	date = db.DateTimeProperty(auto_now_add=True)
	mtype = db.StringProperty(default=None)		# Тип сообщения: none-обычное сообщение, debug-отладочное сообщение, alarm-срочное сообщение и т.д.
	label = db.IntegerProperty(default=0)		# Числовая метка для определения групп сообщений. (пока не используется)
	pos = db.GeoPtProperty()

from inform import Informer
from alarm import Alarm
from datamodel.channel import inform
from datamodel.accounts import DBAccounts
from datetime import datetime

def AddLog(log):
	text = log.get('text')
	if log.get('mtype') == 'alarm':
		if text is None:
			text = u'Нажата тревожная кнопка.'
		alarmmsg = Alarm.add_alarm(log.get('imei', '-'), log.get('fid', 10), db.GeoPt(log.get('lat',0.0), log.get(lon, 0.0)), log.get('ceng', ''))

	if log.get('mtype') == 'alarm_confirm':
		if text is None:
			text = u'Тревога подтверждена оператором %s' % DBAccounts.get(db.Key(log.get('akey'))).user.nickname()

	if log.get('mtype') == 'alarm_cancel':
		if text is None:
			text = u'Отбой тревоги оператором %s' % DBAccounts.get(db.Key(log.get('akey'))).user.nickname()

	if text != 'ignore me':	# Ping
		gpslog = GPSLogs(parent = log['skey'], text = text, label = log.get('label', 0), mtype = log.get('mtype', ''), pos = db.GeoPt(log.get('lat', 0.0), log.get('lon', 0.0)))
		gpslog.put()

		inform(log['skey'], 'addlog', {
			'skey': str(log['skey']),
			#'time': gpslog.date.strftime("%d/%m/%Y %H:%M:%S"),
			'time': datetime.utcnow().strftime("%y%m%d%H%M%S"),
			'text': text,
			'label': log.get('label', 0),
			'mtype': log.get('mtype', ''),
			'key': "%s" % gpslog.key(),
			'data': {
				'lat': log.get('lat', 0.0),
				'lon': log.get('lon', 0.0),
				'fid': log.get('fid', 0),
				'ceng': log.get('ceng', ''),
				'dt': datetime.now().strftime("%y%m%d%H%M%S")
			}

		})	# Информировать всех пользователей, у которых открыта страница Отчеты

	#newconfigs = DBNewConfig.get_by_imei(imei)
	#newconfig = newconfigs.config
	#if newconfig and (newconfig != {}):
	#	self.response.out.write('CONFIGUP\r\n')
	#	memcache.set("update_config_%s" % imei, "yes")
	""" TBD! Вынести в описание класса """


	#for info in Informer.get_by_imei(imei):
	#	self.response.out.write(info + '\r\n')
