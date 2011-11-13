# -*- coding: utf-8 -*-
import webapp2

config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'my-super-secret-key-000',
}

app = webapp2.WSGIApplication([
	(r'/bingps/parse.*', 'bingps.BinGpsParse'),
	(r'/bingps.*', 'bingps.BinGps'),

	(r'/api/version', 'api.Version'),
	(r'/api/sys/secure_list', 'api.Sys_SecureList'),


	(r'/api/channel/gettoken', 'channel.Chanel_GetToken'),
	(r'/api/channel/message', 'channel.Message'),
	(r'/channel/message', 'channel.MessagePost'),
	(r'/_ah/channel/connected/.*', 'channel.ChannelConnectHandler'),
	(r'/_ah/channel/disconnected/.*', 'channel.ChannelDisconnectHandler'),

	(r'/', 'main.MainPage'),
], debug=True, config=config)

