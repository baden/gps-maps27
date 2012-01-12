# -*- coding: utf-8 -*-
import webapp2
import logging

logging.getLogger().setLevel(logging.WARNING)

config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'my-super-secret-key-000',
}

app = webapp2.WSGIApplication([
	(r'/plugins/.*', 'plugins.MainPage'),

	(r'/bingps/parse.*', 'bingps.BinGpsParse'),
	(r'/bingps.*', 'bingps.BinGps'),

	('/api/info.*', 'api.Info'),
	('/api/version.*', 'api.Version'),
	('/api/debug_jqGrid.*', 'api.Debug_jqGrid'),
	('/api/debug_geo.*', 'api.DebugGeo'),
	('/api/get_geo.*', 'api.GetGeo'),

	('/api/geo/del.*', 'api.Geo_Del'),
	('/api/geo/taskdel.*', 'api.Geo_Task_Del'),
	('/api/geo/get*', 'api.Geo_Get'),
	('/api/geo/dates*', 'api.Geo_Dates'),
	('/api/geo/info*', 'api.Geo_Info'),
	('/api/geo/last*', 'api.Geo_Last'),
	('/api/geo/count*', 'api.Geo_Count'),
	('/api/geo/report*', 'api.Geo_Report'),

	('/api/report/get*', 'api.Report_Get'),

	('/api/sys/add*', 'api.Sys_Add'),
	('/api/sys/del*', 'api.Sys_Del'),
	('/api/sys/desc*', 'api.Sys_Desc'),
	('/api/sys/sort*', 'api.Sys_Sort'),
	('/api/sys/config*', 'api.Sys_Config'),
	('/api/sys/tags*', 'api.Sys_Tags'),
	('/api/sys/car*', 'api.Sys_Car'),
	('/api/sys/secure_list*', 'api.Sys_SecureList'),

	('/api/param/desc*', 'api.Param_Desc'),

	('/api/logs/get*', 'api.Logs_Get'),
	('/api/logs/del*', 'api.Logs_Del'),

	('/api/system/config*', 'api.SystemConfig'),

	('/api/zone/add*', 'api.Zone_Add'),
	('/api/zone/get*', 'api.Zone_Get'),
	('/api/zone/del*', 'api.Zone_Del'),
	('/api/zone/info*', 'api.Zone_Info'),
	('/api/zone/rule/create*', 'api.Zone_Rule_Create'),
	('/api/zone/rule/get*', 'api.Zone_Rule_Get'),
	('/api/zone/rule/del*', 'api.Zone_Rule_Del'),

	('/api/alarm/confirm*', 'api.AlarmConfirm'),
	('/api/alarm/cancel*', 'api.AlarmCancel'),
	('/api/alarm/get*', 'api.AlarmGet'),

	('/api/gmap/ceng*', 'api.GMapCeng'),


	('/api/misc/drivers*', 'api.Sys_Misc_Drivers'),


	('/api/admin/operations*', 'api.Admin_Operations'),

	(r'/api/channel/gettoken', 'channel.Chanel_GetToken'),
	(r'/api/channel/message', 'channel.Message'),
	(r'/channel/message', 'channel.MessagePost'),
	(r'/_ah/channel/connected/.*', 'channel.ChannelConnectHandler'),
	(r'/_ah/channel/disconnected/.*', 'channel.ChannelDisconnectHandler'),

	(r'/test.*', 'main.TestMainPage'),
	(r'/main2.*', 'main.TestMain2'),
	(r'/addlog.*', 'main.AddLog'),	# События
	(r'/config.*', 'main.Config'),	# Конфигурация системы
	(r'/binbackup.*', 'main.BinBackup'),
	(r'/inform.*', 'main.Inform'),
	(r'/ping.*', 'main.Ping'),
	(r'/firmware.*', 'main.Firmware'),

	(r'/params.*', 'main.Params'),	# Запрос параметров системы, например localhost/params?cmd=check&imei=353358019726996

	(r'/initconfig.js', 'main.InitConfig'),
	(r'/manifest/gps-maps27\.appcache', 'main.Appcache'),

	#(r'/', 'main.MainPage'),
#], debug=True, config=config)
], debug=False, config=config)

