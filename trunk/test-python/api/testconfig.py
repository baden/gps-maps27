import httplib
import urllib
import urllib2
from struct import pack, unpack
from httplib import HTTP

#GETFROM = "gps-maps.appspot.com:80"
from config import *

def main():
	body=''
	for x in xrange(10):
		body += 'P%s INT 10 10\n' % str(x)

	body += 'testlong LONG 10 10\n'
	body += 'teststr16 STR16 "192.168.0.1" "192.168.0.1"\n'
	body += 'teststr32 STR32 "baden.gps.navi.cc:8000/service" "baden.gps.navi.cc:8000/service"\n'
	body += 'teststr32ws STR32 "data body" "data body"\n'
	body += 'teststr32wq STR32 "data body \"body\" quote" "data body \"body\" quote"\n'
	body += 'teststr32wms STR32 "add some      spaces" ""\n'

	rawPOST2('/config?imei=%s&cmd=save&csq=17&vout=580&vin=3500&phone=1234566778' % (IMEI), body)

if __name__ == "__main__":
	main()
