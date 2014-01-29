# -*- coding: utf-8 -*-

__version__ = '0.1'

__all__ = ['']

imports = [
	(r'/bingps/parse.*', 'point.bingps.BinGpsParse'),
	(r'/bingps.*', 'point.bingps.BinGps'),
	(r'/addlog.*', 'point.main.AddLog'),	# События
	(r'/config.*', 'point.main.Config'),	# Конфигурация системы
	#(r'/binbackup.*', 'point.main.BinBackup'),
	(r'/inform.*', 'point.main.Inform'),
	(r'/ping.*', 'point.main.Ping'),
	(r'/firmware.*', 'point.main.Firmware'),
	(r'/params.*', 'point.main.Params'),	# Запрос параметров системы, например localhost/params?cmd=check&imei=353358019726996
	(r'/manualdel.*', 'point.main.ManualDel'),
]
