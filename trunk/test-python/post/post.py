import socket
from time import sleep

#HOST = 'localhost'
#PORT = 8080
#HOSTNAME = 'localhost'

HOST = 'gps-maps27.appspot.com'
PORT = 80
HOSTNAME = 'gps-maps27.appspot.com'

def senddata(url, body):
	s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	print("Connecting to %s:%d" % (HOST, PORT))
	s.connect((HOST, PORT))

	send = "POST %s HTTP/1.1\r\n" % url
	send+= "Host: %s\r\n" % HOSTNAME
	send+= "Content-type: application/octet-stream\r\n"
	#send+= "Content-type: application/x-www-form-urlencoded\r\n"
	send+= "Content-Length: %d\r\n" % len(body)
	send+= "\r\n"
	send+= body
	send+= '>'

	#print(send)
	#print("{BODY}\n")


	s.send(send)

	while 1:
		s.settimeout(30.0);
		try:
			received = s.recv(1024)
		except:
			print(" Error! Timeout")
			break

		print('DATA:%s' % received)
		if received:
			print received
			break
		else:
			#pass
			sleep(1)
			print(" Error. No server response.")
			#break

	sleep(2)
	s.close()

senddata('/post1', 'a=1&b=2')
senddata('/post2', 'a=1&b=2')
