import httplib
import urllib

from random import randint

#GETFROM = "gps-maps.appspot.com:80"
GETFROM = "localhost:80"

def main():
	conn = httplib.HTTPConnection(GETFROM)
	conn.request("GET", "/addlog?imei=012207005520132&text=Hello,%%20world%%20(%d)!" % randint(1, 10000))
	#conn.request("GET", "/addlog?text=Hello,%%20world(%d)!" % randint(1, 10000))
	response = conn.getresponse()
	print response.status, response.reason
	data = response.read()
	conn.close()
	print data

if __name__ == "__main__":
	main()
