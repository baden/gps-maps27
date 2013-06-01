# -*- coding: utf-8 -*-
from core import BaseApi
import json
import logging

from google.appengine.ext import db

class Add(BaseApi):
	#requred = ('akey')
	def parcer(self):
		from datamodel.zone import DBZone

		#points = self.request.get("points", None)
		ztype = self.request.get('type', 'polygon')
		points = json.loads(self.request.get('points', '[]'))
		zkey = self.request.get('zkey', None)
		bounds = json.loads(self.request.get('bounds', '[[0.0,0.0],[0.0,0.0]'))

		#zkey = DBZone.addZone(ztype, [db.GeoPt(lat=p[0], lon=p[1]) for p in points])
		zkey = DBZone.addZone(ztype, points, zkey=zkey, bounds=bounds)

		return {
			"answer": "ok",
			"points": points,
			"zkey": str(zkey)
		}

class Get(BaseApi):
	#requred = ('akey')
	def parcer(self):
		from datamodel.zone import DBZone

		#points = self.request.get("points", None)
		#points = json.loads(self.request.get('points', '[]'))
		skey = self.request.get("skey", None)
		
		zones = DBZone.getZones().fetch(100)	#DBZone.all().fetch(1000)
		zlist = {}
		for zone in zones:
			zlist[str(zone.key())] ={
				'zkey': str(zone.key()),
				'type': zone.ztype_name,
				'points': [(p.lat, p.lon) for p in zone.points],
				'radius': zone.radius,
				'owner': zone.owner.nickname(),
				'private': zone.private,
				'options': zone.options,
				'name': zone.name,
				'address': zone.address
			}


		if zones:
			return {
				"answer": "ok",
				"zones": zlist
			}
		else:
			return {
				"answer": "no"
			}

class Del(BaseApi):
	#requred = ('akey')
	def parcer(self):
		from datamodel.zone import DBZone

		zkey = self.request.get("zkey", None)

		try:
			db.delete(db.Key(zkey))
		except db.datastore_errors.BadKeyError, e:
			return {'answer': 'no', 'reason': 'account key error', 'comments': '%s' % e}

		return {'answer': 'ok'}

class Info(BaseApi):
	#requred = ('account')
	def parcer(self, **argw):
		from datamodel.zone import DBZone

		zkey = db.Key(self.request.get("zkey", None))

		from datamodel.channel import inform
		from datamodel.namespace import private
		import pickle
		
		if self.request.get('cmd', '') == 'get':
			q = DBZone.get(zkey)
			if q is not None:
				info = {
					'id': q.key().namespace() + ':' + str(q.key().id_or_name()),
					'name': q.name,
					'address': q.address,
					'active': q.active and 'checked' or '',
					'desc': q.desc,
					'comments': q.comments,
				}
			else:
				info = {
				}
		elif self.request.get('cmd', '') == 'set':
			info = {'set': 'set', 'params': self.request.POST.items()}
			z = DBZone.get(zkey)
			items = dict(self.request.POST.items())
			logging.info("set zone datas: %s" % repr(items))
			if z is not None:
				logging.info("z: %s" % repr(z))
				if 'name' in items:
					z.name = items["name"]
				if 'address' in items:
					z.address = items["address"]
				if 'desc' in items:
					z.desc = items["desc"]
				if 'comments' in items:
					z.comments = items["comments"]
				
				z.save()
				#for (k, v) in items.iteritems():
				#	pass
			"""
			DBZone.set( self.skey,
				number = self.request.POST['number'],
				model = self.request.POST['model'],
				year = self.request.POST['year'],
				drive = self.request.POST['drive'],
				vin = self.request.POST['vin'],
				teh = self.request.POST['teh'],
				casco = self.request.POST['casco'],
				comments = self.request.POST['comments']
			)
			"""
		else:
			return {'result': 'error', 'reason': 'unknown operation'}
		
		return {'result': 'ok', 'zkey': str(zkey), 'info': info}


class Rule_Create(BaseApi):
	def parcer(self):
		return {'answer': 'ok'}

class Rule_Get(BaseApi):
	def parcer(self):
		return {'answer': 'ok'}

class Rule_Del(BaseApi):
	def parcer(self):
		return {'answer': 'ok'}
