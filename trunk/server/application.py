# -*- coding: utf-8 -*-
import webapp2
import logging

#logging.getLogger().setLevel(logging.WARNING)

config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'my-super-secret-key-000',
}

from api import imports as api_imports
from plugins import imports as plugins_imports
from point import imports as point_imports

app = webapp2.WSGIApplication([
	(r'/api/channel/gettoken', 'channel.Chanel_GetToken'),
	(r'/api/channel/message', 'channel.Message'),
	(r'/channel/message', 'channel.MessagePost'),
	(r'/_ah/channel/connected/.*', 'channel.ChannelConnectHandler'),
	(r'/_ah/channel/disconnected/.*', 'channel.ChannelDisconnectHandler'),
	#(r'/', 'main.MainPage'),
#], debug=True, config=config)
] + api_imports + plugins_imports + point_imports, debug=False, config=config)

