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

if __name__ == "__main__":
	main()
