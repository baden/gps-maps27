# -*- coding: utf-8 -*-
from core import BaseApi
import logging

from datetime import datetime
from utils import unixtime

class List(BaseApi):
	requred = ('nologin')
	def parcer(self):
		from datamodel.firmware import DBFirmware
		#from utils import CRC16

		#firmwares = DBFirmware.get_all(hwid=hwid).fetch(100)
		firmwares = DBFirmware.get_all().fetch(100)

		return {
			'answer': "ok",
			'firmwares': [f.toJSON() for f in firmwares],
			'now': unixtime(datetime.utcnow())
		}
