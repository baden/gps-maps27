# -*- coding: utf-8 -*-

import os
import webapp2
from google.appengine.api import users
from random import randint

class Appcache(webapp2.RequestHandler):
	def get(self):
		self.response.headers['Content-Type'] = 'text/cache-manifest'
		user = users.get_current_user()
		if user == None:
			user = 'None'
		else:
			user = user.nickname()

		
		if os.environ['HTTP_HOST'] == 'localhost':
			version = os.environ['CURRENT_VERSION_ID']	# + str(randint(0, 10**6))	# Такой подход не пашет
		else:
			version = os.environ['CURRENT_VERSION_ID']

		manifest = """CACHE MANIFEST
# AppName: %s
# User: %s
# Version: %s

CACHE:
/stylesheets/all.css
/plugins/jquery-ui-1.8.16/jquery-ui-1.8.16/ui/jquery-ui.js
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/jquery-ui.css
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_72a7cf_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_highlight-hard_100_f2f5f7_1x100.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_highlight-soft_100_deedf7_1x100.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_glass_50_3baae3_1x400.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_ffffff_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_glass_80_d7ebf9_1x400.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_3d80b3_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-icons_2694e8_256x240.png
/plugins/jquery-ui-themes-1.8.16/jquery-ui-themes-1.8.16/themes/cupertino/images/ui-bg_glass_100_e4f1fb_1x400.png
/plugins/jquery-ui-timepicker-0.2.9/jquery.ui.timepicker.js
/plugins/jquery-ui-timepicker-0.2.9/jquery.ui.timepicker.css
/plugins/jquery-ui-1.8.16/jquery-ui-1.8.16/ui/i18n/jquery.ui.datepicker-ru.js
/plugins/colorpicker/js/colorpicker.js
/plugins/colorpicker/css/colorpicker.css
/plugins/colorpicker/images/colorpicker_background.png
/js/jquery-1.7.1.min.js
/js/jquery.cookie.js
/js/chainvas.min.js
/js/init_start.js
/js/init_finish.js
/stylesheets/all.css?v=1
/svg/arrow.svg
/sound/alarm.ogg
/js/all-min.js?v=1
#/_ah/channel/jsapi


# Text external caching
http://maps.gstatic.com/mapfiles/cb/mod_cb_scout/cb_scout_sprite_api_003.png
http://maps.gstatic.com/mapfiles/google_white.png
http://maps.gstatic.com/mapfiles/mv/imgs8.png
http://maps.gstatic.com/mapfiles/mapcontrols3d6.png
http://maps.gstatic.com/mapfiles/rotate2.png
http://maps.gstatic.com/mapfiles/szc4.png
http://maps.gstatic.com/mapfiles/transparent.png
#https://talkgadget.google.com/talkgadget/channel.js


NETWORK:
/
initconfig.js
/_ah/channel
http://localhost/_ah/login
*
""" % (os.environ['APPLICATION_ID'] + '@' + os.environ['SERVER_NAME'], user, version)

		#for i in os.environ.keys():
		#	manifest += '# ' + i + ' = ' + str(os.environ[i]) + '\n'
		self.response.write(manifest)
