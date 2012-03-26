

# обновление программного обеспечения
from test import BaseHandler
class Firmware(BaseHandler):
	def get(self):
		from datamodel.firmware import DBFirmware
		from utils import CRC16
		cmd = self.request.get('cmd', None)
		key = self.request.get('key', None)
		swid = self.request.get('swid', None)
		if swid is not None:
			swid = int(swid, 16)
		hwid = self.request.get('hwid', None)
		if hwid is not None:
			hwid = int(hwid, 16)
		boot = (self.request.get('boot', 'no') == 'yes')
		subid = int(self.request.get('subid', '0'), 16)

		if cmd:
			if cmd == 'del':
				try:
					DBFirmware.get(db.Key(self.request.get('key', None))).delete()
				finally:
					self.redirect("/firmware")

			elif cmd == 'check':	# Запросить версию самой свежей прошивки
				self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
					
				fw = DBFirmware.get_all(boot=boot, hwid=hwid, subid=subid).order('-swid').get()
				if fw:
					self.response.write("SWID: %04X\r\n" % fw.swid)
				else:
					self.response.write("NOT FOUND\r\n")

			elif cmd == 'getbin':
				self.response.headers['Content-Type'] = 'application/octet-stream'
				if key is not None:
					fw = DBFirmware.get(db.Key(key))
				else:
					fw = DBFirmware.get_all(boot=boot, hwid=hwid, swid=swid).get()
				if fw:
					self.response.write(fw.data)
				else:
					self.response.write('NOT FOUND\r\n')

			elif cmd == 'get':
				if key is not None:
					fw = DBFirmware.get(db.Key(key))
				else:
					fw = DBFirmware.get_all(boot=boot, hwid=hwid, subid=subid, swid=swid).get()

				self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
				if fw:
					by = 0
					line = 0
					crc2 = 0
					self.response.write("SWID:%04X" % fw.swid)
					self.response.write("\r\nLENGTH:%04X" % len(fw.data))

					for byte in fw.data:
						if by == 0:
							self.response.out.write("\r\nLINE%04X:" % line)
							line = line + 1
							by = 32
						self.response.write("%02X" % ord(byte))
						crc2 = CRC16(crc2, ord(byte))
						by = by - 1
					self.response.write("\r\n")
					self.response.write("CRC:%04X\r\n" % crc2)
					self.response.write("ENDDATA\r\n")
				else:
					self.response.write('NOT FOUND\r\n')

			elif cmd == 'getpack':
				if key:
					fw = DBFirmware.get(db.Key(key))
				else:
					fw = DBFirmware.get_all(boot=boot, hwid=hwid, subid=subid, swid=swid).get()

				#self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
				self.response.headers['Content-Type'] = 'text/html'
				if fw:
					by = 0
					line = 0
					crc2 = 0
					self.response.write("SWID:%04X" % fw.swid)
					self.response.write("\r\nLENGTH:%04X" % len(fw.data))

					for byte in fw.data:
						if by == 0:
							self.response.write("\r\nL%03X:" % line)
							line = line + 1
							by = 64
						#self.response.out.write("%02X" % ord(byte))
						#if ord(byte)>=16:
						
						if ord(byte) in (0x0D, 0x0A, 0x00, 0x01):
							self.response.write('\x01' + chr(ord(byte)+32))
						else:
							self.response.write(byte)
						
						"""
						if ord(byte) >= 33:
							self.response.out.write(byte)
						else:
							#self.response.out.write('\x0F' + chr(ord(byte)+32))
							self.response.out.write('\x20' + chr(ord(byte)+32))
						"""
						
						crc2 = CRC16(crc2, ord(byte))
						by = by - 1
					for i in range(by):
						self.response.write('-');	# заполним последнюю строку чтобы не была короткой
						
					self.response.write("\r\nIGNOREME-IGNOREME-IGNOREME-IGNOREME-IGNOREME-IGNOREME-IGNOREME\r\n")
					self.response.write("CRC:%04X\r\n" % crc2)
					self.response.write("ENDDATA\r\n")
				else:
					self.response.write('NOT FOUND\r\n')
			else:
				self.redirect("/firmware")
		else:
			template_values = {}
			firmwares = DBFirmware.get_all(hwid=hwid).fetch(100)
			template_values['firmwares'] = [f.todict() for f in firmwares]
			self.render_template('' + self.__class__.__name__ + '.html', **template_values)

	def post(self):
		from datamodel.firmware import DBFirmware
		self.response.headers['Content-Type'] = 'text/plain'

		data = {
			'boot': self.request.get('boot'),
			'pdata': self.request.body,
			'hwid': int(self.request.get('hwid'), 16),
			'swid': int(self.request.get('swid'), 16),
			'subid': int(self.request.get('subid', 0), 10)
		}
		DBFirmware.add(data);

		self.response.write("ROM ADDED: %d\r\n" % len(data['pdata']))

