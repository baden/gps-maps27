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

	rawPOST2('/config?imei=%s&cmd=save&csq=17&vout=580&vin=3500&phone=1234566778' % (IMEI), body)

if __name__ == "__main__":
	main()
