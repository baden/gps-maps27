# -*- coding: utf-8 -*-

from google.appengine.ext import db
from google.appengine.api import memcache
#
#  ������������ ��� �������� ������� ���������.
#  - �������������� � ����� ������������ (���� �� ������������)
#  - ������������� ������� ��� SIM20
#  - ������ ������� ��� SIM20
#
class Informer(db.Model):
	cdate = db.DateTimeProperty(auto_now_add=True)	# ����� �������� �������������
	messages = db.StringListProperty(default=None)
#
#	�������� ������ ��� ������� �� IMEI
#
	@classmethod
	def get_by_imei(cls, imei):
		data = memcache.get("inform_%s" % imei)
		if data is not None:
			return data
		else:
			req = cls.get_by_key_name("inform_%s" % imei)
			if req:
				memcache.set("inform_%s" % imei, req.messages)
				return req.messages
			else:
				memcache.set("inform_%s" % imei, [])
				return []

#
#	�������� ������ ��� ������� �� IMEI
#
	@classmethod
	def add_by_imei(cls, imei, msg='MSG_OTHER'):
		def txn():
			entity = cls.get_by_key_name("inform_%s" % imei)
			if entity is None:
				entity = cls(key_name="inform_%s" % imei, messages=[msg])
				memcache.set("inform_%s" % imei, [msg])
				entity.put()
			else:
				if msg not in entity.messages:
					entity.messages.append(msg)
				memcache.set("inform_%s" % imei, entity.messages)
				entity.put()

			return entity

		return db.run_in_transaction(txn)

#
#	�������� ������ ��� ������� �� skey
#
	@classmethod
	def add_by_skey(cls, skey, msg='MSG_OTHER'):
		return cls.add_by_imei(skey.name())

#
#	������� ��� ������ ��� ������� �� IMEI
#
	@classmethod
	def purge_by_imei(cls, imei):
		memcache.delete("inform_%s" % imei)
		entity = cls.get_by_key_name("inform_%s" % imei)
		if entity is not None:
			db.delete(entity)

#
#	������� ��������� ������ ��� ������� �� IMEI
#
	@classmethod
	def del_by_imei(cls, imei, msg):
		def txn():
			entity = cls.get_by_key_name("inform_%s" % imei)
			if entity is not None:
				if msg in entity.messages:
					entity.messages.remove(msg)
				if len(entity.messages) == 0:
					memcache.delete("inform_%s" % imei)
					db.delete(entity)
				else:
					memcache.set("inform_%s" % imei, entity.messages)
					entity.put()
			return entity

		return db.run_in_transaction(txn)
