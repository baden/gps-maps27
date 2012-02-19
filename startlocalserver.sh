#!/bin/sh
gae=~/sdk/google_appengine/
echo $gae
$gae/dev_appserver.py --port=8080 --debug --datastore_path=var/gps-maps27_datastore --high_replication --use_sqlite  ./server/
#$gae/dev_appserver.py --port=8080 --debug ./server/

