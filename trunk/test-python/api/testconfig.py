import httplib
import urllib
import urllib2
from struct import pack, unpack
from httplib import HTTP

#GETFROM = "gps-maps.appspot.com:80"
SERVER = "localhost"
SERVER_PORT = 80
IMEI = "1234"

def main():
	body=''
	for x in xrange(10):
		body += 'P%s INT 10 10\n' % str(x)

	http = HTTP(SERVER, SERVER_PORT)
	http.putrequest('POST', '/config?imei=%s&cmd=save' % (IMEI))
	http.putheader('Content-Type', 'application/binary')
	http.putheader('Content-Length', str(len(body)))
	http.endheaders()
	http.send(body)
	code, msg, headers = http.getreply()
	result = http.file.read()

	print 'code=%s, msg=%s, headers=%s' % (code, msg, headers)
	print 'result=%s' % result

if __name__ == "__main__":
	main()
