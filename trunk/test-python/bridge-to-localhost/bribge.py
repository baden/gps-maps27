#!/usr/bin/python
# -*- coding: utf-8 -*-
# testbin.py

import os
import sys
import httplib
import urllib
import socket
from time import sleep
from datetime import datetime, date

# Where got data
#GETFROM = "127.0.0.1:80"
GETFROM = "gps-maps.appspot.com:80"

COUNT = 1
# Where send to...

#HOST = "127.0.0.1"
#PORT = 8080

HOST = "gps-maps27.appspot.com"
PORT = 80

HOSTNAME = "gps-maps27.appspot.com"

#HOST = "gps-maps2.appspot.com"
#PORT = 80

#HOST = "212.110.139.65"	# старый
#HOST = "217.24.167.101"
#PORT = 8015

#HOSTNAME = "gps-maps.appspot.com"

IMEI = sys.argv[1]

LASTDIR = "last"
LASTFILE = LASTDIR + "/lastcdate-%s.txt" % IMEI
LOGDIR = "log/%s" % IMEI
LOGFILE = LOGDIR+"/%s-ok.log" % date.today()
ERRFILE = LOGDIR+"/%s-error.log" % date.today()

def senddata(body):
	#return True			# disable sending
	answ = False

	#if SYS>4:
	#	print("Support SYS=[1,3]. fail")
	#	return
	
	#body = open("gps%d/%s" % (SYS, IMAGE), "rb").read()
	s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	print("Connecting to %s:%d" % (HOST, PORT))
	s.connect((HOST, PORT))

	#send = "POST /bingps?imei=%s&dataid=%d HTTP/1.1\r\n" % (IMEI[SYS], 0)
	send = "POST /bingps?imei=%s&dataid=%d HTTP/1.1\r\n" % (IMEI, 0)
	send+= "Host: %s\r\n" % HOSTNAME
	#send+= "Content-type: application/octet-stream\r\n"
	send+= "Content-Length: %d\r\n" % len(body)
	send+= "\r\n"
	send+= body
	send+= '>'

	#print(send)
	#print("{BODY}\n")

	tf = file('backup_%s' % IMEI, 'wb')
	tf.write(send)
	#tf.write(body)
	tf.close()

	s.send(send)
	#s.send(body)
	#s.send('>')
	print("Waiting answer...\n");
	#sleep(1)
	while 1:
		s.settimeout(30.0);
		try:
			received = s.recv(1024)
		except:
			print(" Error! Timeout")
			break

		print('DATA:%s' % received)
		if received:
			if received.find("BINGPS: OK")>=0:
				print(" Ok.")
				answ = True
				break
		else:
			#pass
			sleep(1)
			print(" Error. No server response.")
			#break
	s.close()
	return answ

def main():
	try:
		aftercdate = open(LASTFILE, "r").read()
	except:
		aftercdate = "None"

	print("Time label: %s" % aftercdate)

	print("Request for new data...")

	conn = httplib.HTTPConnection(GETFROM)
	conn.request("GET", "/binbackup?cmd=pack&cnt=%d&imei=%s&after=%s&asc=yes" % (COUNT, IMEI, urllib.quote(aftercdate)))
	response = conn.getresponse()
	#print response.status, response.reason
	data = response.read()
	conn.close()
	#print data

	bindata = response.getheader("BinData", None)

	if not bindata or bindata=="None":
		print("No points. No need update.")
		return

	if len(data) == 0:
		print("Got empty answer. No need update.")
		return

	lastcdate = response.getheader("lastcdate", None)
	print("Data length: %d" % len(data))
	print("Time label for new data: %s" % lastcdate)


	for i in xrange(3):
		print("Try for sending (%d/3)..." % i)
		if senddata(data)==True:
			if lastcdate:
				print("Saving time label")
				#try:
				file(LASTFILE, "w").write("%s" % lastcdate)
			break
		else:
			print("Error destination server.")


class Logger(object): 
	def __init__(self, terminal, directory, logfile):
		try:
			os.makedirs(directory)
		except OSError:
			pass

		self.terminal = terminal
		self.log = open(logfile, 'a')

	def __del__(self):
		self.terminal.flush()
		self.log.close()

	def write(self, message): 
		#self.terminal.write(message) 
		#if len(message) > 1:
		if message != '\n':
			self.log.write("%s  %s" % (datetime.now().strftime("%y-%m-%d %H:%M:%S"), message))
		else:
			self.log.write(message)

if __name__ == "__main__":
	try:
		os.makedirs(LASTDIR)
	except OSError:
		pass

	sys.stdout = Logger(sys.stdout, LOGDIR, LOGFILE)
	sys.stderr = Logger(sys.stderr, LOGDIR, ERRFILE)

	main()
	#sys.stdout.flush()
	#sys.stderr.flush()
	sys.stdout = sys.__stdout__
	sys.stderr = sys.__stderr__
