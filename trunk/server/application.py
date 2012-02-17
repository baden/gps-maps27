# -*- coding: utf-8 -*-
import webapp2
import logging

#logging.getLogger().setLevel(logging.WARNING)

config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'my-super-secret-key-000',
}

from api import imports as api_imports

app = webapp2.WSGIApplication([
	(r'/plugins/.*', 'plugins.MainPage'),
	(r'/initconfig.js', 'main.InitConfig'),
	(r'/manifest/gps-maps27\.appcache', 'main.Appcache'),
	(r'/test.*', 'main.TestMainPage'),
	(r'/main2.*', 'main.TestMain2'),


	(r'/bingps/parse.*', 'bingps.BinGpsParse'),
	(r'/bingps.*', 'bingps.BinGps'),
	(r'/addlog.*', 'main.AddLog'),	# События
	(r'/config.*', 'main.Config'),	# Конфигурация системы
	(r'/binbackup.*', 'main.BinBackup'),
	(r'/inform.*', 'main.Inform'),
	(r'/ping.*', 'main.Ping'),
	(r'/firmware.*', 'main.Firmware'),
	(r'/params.*', 'main.Params'),	# Запрос параметров системы, например localhost/params?cmd=check&imei=353358019726996


	(r'/api/channel/gettoken', 'channel.Chanel_GetToken'),
	(r'/api/channel/message', 'channel.Message'),
	(r'/channel/message', 'channel.MessagePost'),
	(r'/_ah/channel/connected/.*', 'channel.ChannelConnectHandler'),
	(r'/_ah/channel/disconnected/.*', 'channel.ChannelDisconnectHandler'),


	#(r'/', 'main.MainPage'),
#], debug=True, config=config)
] + api_imports, debug=False, config=config)

