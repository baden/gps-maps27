import httplib
import urllib

#GETFROM = "gps-maps.appspot.com:80"
GETFROM = "localhost:80"

def main():

	body=''
	for x in xrange(256):
		body += chr(x)

	conn = httplib.HTTPConnection(GETFROM)
	conn.request("POST", "/bingps?imei=012207005520132&csq=18&dataid=00000000", body)
	response = conn.getresponse()
	print response.status, response.reason
	data = response.read()
	conn.close()
	print data

if __name__ == "__main__":
	main()
