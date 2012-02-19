# -*- coding: utf-8 -*-
#class InitConfig(webapp2.RequestHandler):
"""
	Этот скрипт более не используется. Перенесено в /api/info
"""

class InitConfig(BaseHandler):
	def config(self):
		from datamodel.geo import getGeoLast
		from datamodel.accounts import DBDomain
		self.response.headers['Content-Type'] = 'text/javascript; charset=utf-8'

		user = users.get_current_user()
		test_value = self.session.get('test-value')
		if test_value:
			pass
		else:
			self.session['test-value'] = 1

		if user is None:
			return {
				'answer': 'no',
				'reason': 'Required login.',
				'user': {
					#'email': user.email(),
					#'nickname': user.nickname(),
					#'id': user.user_id(),
					'login_url': users.create_login_url('/'),
					'logout_url': users.create_logout_url('/'),
					#'admin': users.is_current_user_admin(),
				}
			}
		account = DBAccounts.get_by_user(user)
		
		if account is None:
			return {
				'answer': 'no',
				'reason': 'Required login.',
				'user': {
					'email': user.email(),
					'nickname': user.nickname(),
					'id': user.user_id(),
					'login_url': users.create_login_url('/'),
					'logout_url': users.create_logout_url('/'),
					'admin': users.is_current_user_admin(),
				}
			}
		"""
			Так как эта процедура может занимать много времени, то сделаем это асинхронно
			Хотя все равно уже на 80 системах это занимает около секунды. Не хотется думать что будет при тысяче систем.
		"""
		systems_rpc = account.systems_async
		lasts = getGeoLast(account.systems_key)

		login_url = users.create_login_url('/')
		logout_url = users.create_logout_url('/')

		systems = [sys.todict() for sys in systems_rpc.get_result()]

		for s in systems:
			s['last'] = lasts[s['key']]

		domain = DBDomain.get()
		if domain is None:
			domain = DBDomain.set()
		return {
			'version': VERSION,
			'session': {
				'test_value': test_value,
			},
			'server_name': os.environ['SERVER_NAME'],
			'domain': domain.todict(),
			'account': {
				'key': str(account.key()),
				'user': {
					'email': account.user.email(),
					'nickname': account.user.nickname(),
					'id': account.user.user_id(),
					'login_url': login_url,
					'logout_url': logout_url,
					'admin': users.is_current_user_admin(),
				},
				'config': account.pconfig,
				'name': account.name,
				'systems': systems
			}
		}

	#@login_required
	def get(self):
		self.response.write('console.log("initconfig.js"); config = $.extend(config, ' + json.dumps(self.config(), indent=2) + ');\r')
