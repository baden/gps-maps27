import httplib
import urllib

#GETFROM = "gps-maps.appspot.com:80"
GETFROM = "localhost:80"

def main():
	conn = httplib.HTTPConnection(GETFROM)
	conn.request("GET", "/addlog?imei=356895035359317&text=Hello")
	response = conn.getresponse()
	print response.status, response.reason
	data = response.read()
	conn.close()
	print data

if __name__ == "__main__":
	main()
