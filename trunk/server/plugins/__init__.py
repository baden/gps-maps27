# -*- coding: utf-8 -*-

__version__ = '0.1'

__all__ = ['plugins']

imports = [
	(r'/plugins/.*', 'plugins.zip.MainPage'),
#	(r'/initconfig.js', 'plugins.init.InitConfig'),
	(r'/manifest/gps-maps27\.appcache', 'plugins.cache.Appcache'),
	(r'/test.*', 'plugins.test.TestMainPage'),
	(r'/main2.*', 'plugins.test.TestMain2'),
]
