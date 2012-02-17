from random import randint
import httplib
import urllib
import urllib2
from struct import pack, unpack
from httplib import HTTP


#GETFROM = "gps-maps.appspot.com:80"

from config import *

def main():
	simpleGET2('/addlog?imei=%s&text=Hello,%%20world%%20(%d)!' % (IMEI, randint(1, 10000)))
	"""
	conn = httplib.HTTPConnection(SERVER)
	conn.request("GET", "/addlog?imei=%s&text=Hello,%%20world%%20(%d)!" % (IMEI, randint(1, 10000)))
	#conn.request("GET", "/addlog?text=Hello,%%20world(%d)!" % randint(1, 10000))
	response = conn.getresponse()
	print response.status, response.reason
	data = response.read()
	conn.close()
	print data
	"""

if __name__ == "__main__":
	main()
