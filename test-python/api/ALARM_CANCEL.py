import httplib
import urllib

#GETFROM = "gps-maps.appspot.com:80"
GETFROM = "localhost:80"

def main():
	conn = httplib.HTTPConnection(GETFROM)
	conn.request("GET", "/inform/del?imei=356895035359317&msg=ALARM_CANCEL")
	#conn.request("GET", "/inform/del?imei=353358019726996&msg=ALARM_CANCEL")
	response = conn.getresponse()
	print response.status, response.reason
	data = response.read()
	conn.close()
	print data

if __name__ == "__main__":
	main()
