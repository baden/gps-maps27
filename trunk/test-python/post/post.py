import httplib
from time import sleep

#HOST = 'localhost'
#PORT = 8080
#HOSTNAME = 'localhost'

HOST = 'localhost'
#HOST = 'gps-maps27.appspot.com'
PORT = 80

IMEI = "356895035359317"

def senddata(url, body):
	conn = httplib.HTTPConnection(HOST, PORT, timeout=10)
	conn.request("POST", url, body)
	response = conn.getresponse()
	print response.status, response.reason
	data = response.read()
	conn.close()
	print data

	#bindata = response.getheader("BinData", None)

body = file('binbackup', 'rb').read()
senddata("/bingps?imei=%s" % (IMEI), body)
