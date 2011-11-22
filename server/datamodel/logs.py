# -*- coding: utf-8 -*-

from google.appengine.ext import db

"""
	События не привязанные точно ко времени (включения/выключения, получение/выполнение SMS-команд и т.д.)
"""
class GPSLogs(db.Model):
	text = db.StringProperty(multiline=True)
	date = db.DateTimeProperty(auto_now_add=True)
	mtype = db.StringProperty(default=None)	# Тип сообщения: none-обычное сообщение, debug-отладочное сообщение, alarm-срочное сообщение и т.д.
	label = db.IntegerProperty(default=0)		# Числовая метка для определения групп сообщений. (пока не используется)
	pos = db.GeoPtProperty()
