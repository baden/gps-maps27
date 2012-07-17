# -*- coding: utf-8 -*-

__author__ = "Batrak Denis"

import os
import logging

#from google.appengine.api import channel
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

#os.environ['CONTENT_TYPE'] = "application/octet-stream"
from core import BaseApi
from core import MAXPOINTS

# parent = skey
class DBExport(db.Model):
	created = db.DateTimeProperty(auto_now_add=True)
	etype = db.StringProperty(multiline=False)	# тип экспортируемого документа
	dtfrom = db.DateTimeProperty()
	dtto = db.DateTimeProperty()
	title = db.StringProperty(multiline=False)	# Заголовок отчета (имя)
	data = db.BlobProperty()			# Экспортированный документ
	size = db.IntegerProperty()

class XLS(BaseApi):
	requred = ('skey')
	def parcer(self):
		#self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		#import io
		from StringIO import StringIO
		import sys
		import json
		from datetime import datetime, timedelta
		sys.path.insert(0, 'xlwt.zip')  # Add .zip file to front of path
		from xlwt import *
		import re
		import iso8601

		#args = self.request.arguments()
		data = json.loads(self.request.get('data', '[]'))
		src = json.loads(self.request.get('src', '{}'))
		logging.info('DATA: %s' % repr(data))
		info = json.loads(self.request.get('info', '{}'))
		dtfrom = datetime.strptime(info['start'], "%y%m%d%H%M%S")
		dtto = datetime.strptime(info['stop'], "%y%m%d%H%M%S")

		font0 = Font()
		font0.name = 'Times New Roman'
		font0.struck_out = True
		font0.bold = True

		style0 = XFStyle()
		style0.font = font0

		wb = Workbook()
		ws0 = wb.add_sheet(u'Отчет')

		borders = [Borders() for i in range(7)]

		# Стили заголовка
		borders[0].left = 1
		borders[0].top = 1
		borders[0].bottom = 1

		borders[1].top = 1
		borders[1].bottom = 1

		borders[2].right = 1
		borders[2].top = 1
		borders[2].bottom = 1

		# Стили тела таблицы
		borders[3].left = 1
		#borders[4].left = 1
		#borders[5].left = 1
		borders[6].right = 1

		style = [XFStyle() for i in range(7)]
		for i in range(7): style[i].borders = borders[i]

		dtstyle = XFStyle()
		dtstyle.num_format_str = 'MM/DD/YYYY hh:mm:ss'
		tstyle = XFStyle()
		tstyle.num_format_str = 'hh:mm:ss'
		nstyle = XFStyle()
		nstyle.num_format_str = '0.00'

		ws0.write(0, 0, u'Действие', style[0])
		ws0.write(0, 1, u'Примечание', style[1])
		ws0.write(0, 2, u'Период', style[1])
		ws0.write(0, 3, u'Время', style[2])

    		#datestyle.num_format_str = fmt

		i = 1
		for line in data:
			#borders = Borders()
			#borders.left = i
			#borders.right = i
			#borders.top = i
			#borders.bottom = i

			#style = XFStyle()
			#style.borders = borders

			#ws0.write(i, 2, '', style)
			#ws0.write(i, 3, hex(i), style0)
			#ws0.write(i, 4, par)
			#ws0.write(i, 5, self.request.get(par, ''))
			j = 0
			for cell in line:
				ws0.write(i, j, cell.strip(), style[j+3])
				j += 1
			i += 1

		ws0.col(0).width = 3000
		ws0.col(1).width = 14000
		ws0.col(2).width = 4500
		ws0.col(3).width = 2600


		ws1 = wb.add_sheet(u'Движение')
		ws1.write(0, 0, u'Начало', style[0])
		ws1.write(0, 1, u'Конец', style[1])
		ws1.write(0, 2, u'Время', style[1])
		ws1.write(0, 3, u'Расстояние', style[2])
		ws1.write(0, 4, u'Средняя скорость', style[2])
		ws1.write(0, 5, u'Расход топлива', style[2])
		ws1.col(0).width = 5500
		ws1.col(1).width = 5500
		ws1.col(2).width = 4500
		ws1.col(3).width = 4500
		ws1.col(4).width = 4500
		ws1.col(5).width = 4500

		ws2 = wb.add_sheet(u'Стоянка')
		ws2.write(0, 0, u'Начало', style[0])
		ws2.write(0, 1, u'Конец', style[1])
		ws2.write(0, 2, u'Время', style[1])
		ws2.write(0, 3, u'Адрес', style[1])
		ws2.col(0).width = 5500
		ws2.col(1).width = 5500
		ws2.col(2).width = 4500
		ws2.col(3).width = 14500

		i = [1,1]
		for r in src['rows']:
			logging.info('== r = %s' % repr(r))
			if r['type'] == u'move':
				ws1.write(i[0], 0, datetime.strptime(r['start'], "%d/%m/%Y %H:%M:%S"), dtstyle)
				ws1.write(i[0], 1, datetime.strptime(r['stop'], "%d/%m/%Y %H:%M:%S"), dtstyle)
				ws1.write(i[0], 2, datetime.fromtimestamp(r['duration']), tstyle)
				ws1.write(i[0], 3, float(r['length']), nstyle)
				ws1.write(i[0], 4, r['speed'], nstyle)
				ws1.write(i[0], 5, r['fuel'], nstyle)
				#ws1.write(i[0], 0, iso8601.parse_date(r['start']), dtstyle)
				#ws1.write(i[0], 1, iso8601.parse_date(r['stop']), dtstyle)
				i[0] += 1
			elif r['type'] == u'stop':
				ws2.write(i[1], 0, datetime.strptime(r['start'], "%d/%m/%Y %H:%M:%S"), dtstyle)
				ws2.write(i[1], 1, datetime.strptime(r['stop'], "%d/%m/%Y %H:%M:%S"), dtstyle)
				ws2.write(i[1], 2, datetime.fromtimestamp(r['duration']), tstyle)
				if 'address' in r:
					ws2.write(i[1], 3, r['address'], style[0])
					
				#ws1.write(i[0], 0, iso8601.parse_date(r['start']), dtstyle)
				#ws1.write(i[0], 1, iso8601.parse_date(r['stop']), dtstyle)
				i[1] += 1
		'''
		parce_date = r'(?P<day>\d+)/(?P<month>\d+)/(?P<year>\d+)'
		parce_range = r'(?P<h1>\d+):(?P<m1>\d+):(?P<s1>\d+) - (?P<h2>\d+):(?P<m2>\d+):(?P<s2>\d+)'

		i = [1,1]
		dt = None
		for line in data:
			if line[0].strip() == u'Движение':
				ma = re.search( parce_range, line[2].strip())
				if ma is not None:
					gr = ma.groupdict()
					td1 = timedelta(hours=int(gr['h1'], 10), minutes=int(gr['m1'], 10), seconds=int(gr['s1'], 10))
					td2 = timedelta(hours=int(gr['h2'], 10), minutes=int(gr['m2'], 10), seconds=int(gr['s2'], 10))
					#logging.info('gr = %s (%s - %s)' % (repr(gr), td1, td2))
					if dt is not None:
						ws1.write(i[0], 0, dt + td1, dtstyle)
						ws1.write(i[0], 1, dt + td2, dtstyle)
						ws1.write(i[0], 2, datetime.strptime(line[3], '%H:%M:%S'), tstyle)
						ma1 = re.search( r'(?P<dist>\d*\.\d+|\d+) (?P<val1>\S+), (?P<speed>\d*\.\d+|\d+) (?P<val2>\S+), (?P<top>\d*\.\d+|\d+) (?P<val3>\S+)', line[1].strip())
						#ma1 = re.search( r'(?P<dist>\d*\.\d+|\d+) (?P<val1>\S+), (?P<speed>\d+)', line[1].strip())
						logging.info('==== [%s]' % line[1].strip())
						if ma1:
							gr1 = ma1.groupdict()
							logging.info('gr1 = %s' % repr(gr1))
							#if gr['val1'] == 'км';
							#	dist = int(gr['dist'], 10) * 1000
							ws1.write(i[0], 3, 0, style[0])
						i[0] += 1
			elif line[0].strip() == u'Стоянка' or line[0].strip() == u'Остановка':
				ws2.write(i[1], 0, '---', style[0])
				i[1] += 1
			else:
				#logging.info('Other line = %s' % repr(line))
				ma = re.search( parce_date, line[0].strip())
				if ma is not None:
					gr = ma.groupdict()
					dt = datetime(int(gr['year'], 10), int(gr['month'], 10), int(gr['day'], 10))
					#logging.info('gr = %s (%s)' % (repr(gr), str(dt)))
		'''
		#ws0.write_merge(5, 8, 6, 10, "")

        	#import CompoundDoc
        	#doc = CompoundDoc.XlsDoc()

		#self.response.out.write(wb.get_biff_data())

		#wb.save('blanks.xls')
		#wb.save(self.response.out)

		#out = io.BytesIO()
		out = StringIO()
		wb.save(out)
		
		raw = out.getvalue()

		rec = DBExport(parent = self.skey, etype = 'xls', dtfrom = dtfrom, dtto = dtto, title = info['title'], data = raw, size = len(raw))
		rec.put()

		return {
			'answer': "ok",
			'export': {
				'key': str(rec.key()),
				'info': {
					'created': rec.created.strftime("%y%m%d%H%M%S"),
					'etype': rec.etype,
					'skey': str(rec.parent().key()),
					'start': rec.dtfrom.strftime("%y%m%d%H%M%S"),
					'stop': rec.dtfrom.strftime("%y%m%d%H%M%S"),
					'title': rec.title
				}
			}
		}

class List(BaseApi):
	requred = ('skey')
	def parcer(self):
		explist = DBExport.all().ancestor(self.skey).order('-dtfrom')
		data = dict([[str(q.key()), {
			'created': q.created.strftime("%y%m%d%H%M%S"),
			'etype': q.etype,
			'skey': str(q.parent().key()),
			'start': q.dtfrom.strftime("%y%m%d%H%M%S"),
			'stop': q.dtfrom.strftime("%y%m%d%H%M%S"),
			'title': q.title
		}] for q in explist])
		return {
			'answer': "ok",
			'list': data
		}


class Get(webapp.RequestHandler):
	def get(self):
		self.response.headers['Content-Type'] = 'application/octet-stream'	# Это единственный (пока) способ побороть Transfer-Encoding: chunked
		key = self.request.get('key', None)
		if key:
			rec = DBExport.get(db.Key(key))
			self.response.out.write(rec.data)
			#db.delete(rec)

class Del(webapp.RequestHandler):
	def get(self):
		key = self.request.get('key', None)
		try:
			DBExport.get(db.Key(key)).delete()
		except:
			self.response.out.write("FAIL")
			return
		self.response.out.write("OK")
