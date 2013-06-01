

rem appcfg.py --oauth2 create_bulkloader_config --filename=bulkloader.yaml --url=http://gps-maps27.appspot.com/_ah/remote_api
appcfg.py --oauth2 download_data --config_file=bulkloader.yaml --filename=gpslogs.csv --kind=GPSLogs --url=http://gps-maps27.appspot.com/_ah/remote_api

rem appcfg.py --oauth2 download_data --kind=GPSLogs --url=http://gps-maps27.appspot.com/_ah/remote_api --filename=GPSLogs.data
