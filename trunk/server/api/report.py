# -*- coding: utf-8 -*-

"""
	TBD!
	Эта процедура не threadsafe _!!!
	Необходимо избавиться от self (переделать по аналогии с ...)
"""
from core import BaseApi
from core import MAXPOINTS

class Get(BaseApi):
	requred = ('skey')
	def parcer(self):
		from math import log, sqrt
		from datamodel.geo import distance
		from datetime import datetime
		from datamodel.geo import DBGeo
		from datamodel.car import DBCar

		#pfrom = self.request.get("from")
		dtfrom = datetime.strptime(self.request.get("from"), "%y%m%d%H%M%S")

		dtto = datetime.strptime(self.request.get("to"), "%y%m%d%H%M%S")

		slf = {'report': [],
			'stop_start': None,
			'move_start': None,
			'prev_point': None,
			'state': 0,	# 0 - stop   1 - move
			'length': 0,
			'sum_tmove': 0,	# Общее время в пути
			'sum_stop': 0,	# Общее время простоя
			'events': {}
		}
		max_speed = 0	# Максимальная скорость
		sum_length = 0	# Пройденая дистанция

		def check_point(point, slf):
			if point['fsource'] in (2, 3, 7):
				if slf['stop_start'] is None:
					if slf['prev_point']:
						slf['stop_start'] = slf['prev_point']
					else:
						slf['stop_start'] = point

					dura = (slf['stop_start']['time'] - slf['move_start']['time'])
					dura = dura.days * 24 * 3600 + dura.seconds
					slf['sum_tmove'] += dura
					slf['report'].append({
						'type': 'move',
						'start': {
							'time': slf['move_start']['time'].strftime("%y%m%d%H%M%S"),
							'pos': (slf['move_start']['lat'], slf['move_start']['lon']),
						},
						'stop': {
							'time': slf['stop_start']['time'].strftime("%y%m%d%H%M%S"),
							'pos': (slf['stop_start']['lat'], slf['stop_start']['lon']),
						},
						'duration': dura,
						#'durationtxt': str(dura),
						'length': "%.3f" % slf['length'],
						'startpos': (point['lat'], point['lon']),
						'speed': (slf['length'] * 3600 / dura) if dura!=0 else 0,
						'fsource': point['fsource'],
						'events': slf['events'],
					})
					slf['events'] = {}

			elif point['fsource'] == 6:
				if slf['stop_start'] is not None:
					dura = (point['time'] - slf['stop_start']['time'])
					dura = dura.days * 24 * 3600 + dura.seconds
					slf['sum_stop'] += dura
					slf['report'].append({
						'type': 'stop',
						'start': {
							'time': slf['stop_start']['time'].strftime("%y%m%d%H%M%S"),
							'pos': (slf['stop_start']['lat'], slf['stop_start']['lon']),
						},
						'stop': {
							'time': point['time'].strftime("%y%m%d%H%M%S"),
							'pos': (point['lat'], point['lon']),
						},
						'duration': dura,
						#'durationtxt': str(dura),
						'length': 0,
						'startpos': (point['lat'], point['lon']),
						'speed': 0,
						'fsource': point['fsource'],
						'events': slf['events'],
					})
					slf['events'] = {}
					slf['state'] = 1	# Начало движения
					slf['length'] = 0	# Пока не проехали нисколько
					slf['move_start'] = point
					slf['stop_start'] = None

		for point in DBGeo.get_items_by_range(self.skey, dtfrom, dtto, MAXPOINTS):
			if slf['move_start'] is None:
				slf['move_start'] = point
			max_speed = max(max_speed, point['speed'])

			check_point(point, slf)

			if slf['prev_point']:
				if point['fsource'] in (2, 3, 7):
					d = 0
				else:
					d = distance(point, slf['prev_point'])
				td = point['time'] - slf['prev_point']['time']
				td = td.days * 24 * 3600 + td.seconds
				if td > 0:
					sp = d * 3600 / td
					if sp > 300:	# Максимальная скорость 300 км/ч
						#d = 0
						if 'path_break' not in slf['events']:
							slf['events']['path_break'] = point['time'].strftime("%y%m%d%H%M%S")
						continue
			else:
				d = 0
			slf['length'] += d
			sum_length += d
			slf['prev_point'] = point

		if slf['prev_point']:
			if slf['prev_point']['fsource'] in (2,3,7):
			#if slf['prev_point']['fsource'] == 6:
				slf['prev_point']['fsource'] = 6
			else:
				slf['prev_point']['fsource'] = 2



			check_point(slf['prev_point'], slf)

		car = DBCar.get(self.skey)
		return {
			'answer': 'ok',
			'dtfrom': str(dtfrom),
			'dtto': str(dtto),
			'summary': {
				'length': sum_length, #"%.3f" % sum_length,
				'movetime': slf['sum_tmove'],
				'stoptime': slf['sum_stop'],
				'speed': (sum_length * 3600 / slf['sum_tmove']) if (slf['sum_tmove']!=0) else 0,
				'maxspeed': max_speed
			},
			'report': slf['report'],
			'car': car
		}
'''
class Report_Get(BaseApi):
	requred = ('skey')
	def parcer(self):
		from math import log, sqrt
		from datamodel.geo import distance

		#pfrom = self.request.get("from")
		dtfrom = datetime.strptime(self.request.get("from"), "%y%m%d%H%M%S")

		dtto = datetime.strptime(self.request.get("to"), "%y%m%d%H%M%S")

		self.report = []
		self.stop_start = None
		self.move_start = None
		self.prev_point = None
		self.state = 0	# 0 - stop   1 - move
		self.length = 0
		sum_length = 0	# Пройденая дистанция
		self.sum_tmove = 0	# Общее время в пути
		self.sum_stop = 0	# Общее время простоя
		max_speed = 0	# Максимальная скорость
		self.events = {}

		def check_point(point):
			if point['fsource'] in (2, 3, 7):
				if self.stop_start is None:
					if self.prev_point:
						self.stop_start = self.prev_point
					else:
						self.stop_start = point

					dura = (self.stop_start['time'] - self.move_start['time'])
					dura = dura.days * 24 * 3600 + dura.seconds
					self.sum_tmove += dura
					self.report.append({
						'type': 'move',
						'start': {
							'time': self.move_start['time'].strftime("%y%m%d%H%M%S"),
							'pos': (self.move_start['lat'], self.move_start['lon']),
						},
						'stop': {
							'time': self.stop_start['time'].strftime("%y%m%d%H%M%S"),
							'pos': (self.stop_start['lat'], self.stop_start['lon']),
						},
						'duration': dura,
						#'durationtxt': str(dura),
						'length': "%.3f" % self.length,
						'startpos': (point['lat'], point['lon']),
						'speed': (self.length * 3600 / dura) if dura!=0 else 0,
						'fsource': point['fsource'],
						'events': self.events,
					})
					self.events = {}

			elif point['fsource'] == 6:
				if self.stop_start is not None:
					dura = (point['time'] - self.stop_start['time'])
					dura = dura.days * 24 * 3600 + dura.seconds
					self.sum_stop += dura
					self.report.append({
						'type': 'stop',
						'start': {
							'time': self.stop_start['time'].strftime("%y%m%d%H%M%S"),
							'pos': (self.stop_start['lat'], self.stop_start['lon']),
						},
						'stop': {
							'time': point['time'].strftime("%y%m%d%H%M%S"),
							'pos': (point['lat'], point['lon']),
						},
						'duration': dura,
						#'durationtxt': str(dura),
						'length': 0,
						'startpos': (point['lat'], point['lon']),
						'speed': 0,
						'fsource': point['fsource'],
						'events': self.events,
					})
					self.events = {}
					self.state = 1	# Начало движения
					self.length = 0	# Пока не проехали нисколько
					self.move_start = point
					self.stop_start = None

		for point in DBGeo.get_items_by_range(self.skey, dtfrom, dtto, MAXPOINTS):
			if self.move_start is None:
				self.move_start = point
			max_speed = max(max_speed, point['speed'])

			check_point(point)

			if self.prev_point:
				d = distance(point, self.prev_point)
				td = point['time'] - self.prev_point['time']
				td = td.days * 24 * 3600 + td.seconds
				if td > 0:
					sp = d * 3600 / td
					if sp > 300:	# Максимальная скорость 300 км/ч
						#d = 0
						if 'path_break' not in self.events:
							self.events['path_break'] = point['time'].strftime("%y%m%d%H%M%S")
						continue
			else:
				d = 0
			self.length += d
			sum_length += d
			self.prev_point = point

		if self.prev_point:
			if self.prev_point['fsource'] == 6:
				self.prev_point['fsource'] = 2
			else:
				self.prev_point['fsource'] = 6

			check_point(self.prev_point)

		return {
			'answer': 'ok',
			'dtfrom': str(dtfrom),
			'dtto': str(dtto),
			'summary': {
				'length': sum_length, #"%.3f" % sum_length,
				'movetime': self.sum_tmove,
				'stoptime': self.sum_stop,
				'speed': (sum_length * 3600 / self.sum_tmove) if (self.sum_tmove!=0) else 0,
				'maxspeed': max_speed
			},
			'report': self.report,
		}
'''
#def inform_change_slist():
