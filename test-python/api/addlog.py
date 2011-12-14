import httplib
import urllib
import random

#GETFROM = "localhost:80"
GETFROM = "point.gps.navi.cc:80"

def main():
	conn = httplib.HTTPConnection(GETFROM)
	#conn.request("GET", "/addlog?imei=356895035359317&text=Hello")
	conn.request("GET", "/addlog?imei=356895035359317&text=Hello%%20world-%s!" % random.randrange(0,10000))
	response = conn.getresponse()
	print response.status, response.reason
	data = response.read()
	conn.close()
	print data

if __name__ == "__main__":
	main()
	main()
