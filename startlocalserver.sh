#!/bin/sh
gae=../../google_appengine/
echo $gae
$gae/dev_appserver.py --port=8080 --debug --datastore_path=./gps-maps27_datastore ./server/
#$gae/dev_appserver.py --port=8080 --debug ./server/

