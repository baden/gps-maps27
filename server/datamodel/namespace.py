# -*- coding: utf-8 -*-

"""
	Для моделей, которые требют разделения пространства имен необходимо использовать данный модуль
"""

from google.appengine.api import namespace_manager
import os

ROOT_NAMESPACE = 'point'

_USE_SERVER_NAME = 0
_USE_GOOGLE_APPS_DOMAIN = 1
_USE_COOKIE = 2			# Возможно будет использоваться при работе через приложение Google Chrome

_NAMESPACE_PICKER = _USE_SERVER_NAME

'''
def namespace_manager_default_namespace_for_request():
  """Determine which namespace is to be used for a request.

  The value of _NAMESPACE_PICKER has the following effects:

  If _USE_SERVER_NAME, we read server name
  foo.guestbook-isv.appspot.com and set the namespace.

  If _USE_GOOGLE_APPS_DOMAIN, we allow the namespace manager to infer
  the namespace from the request.

  If _USE_COOKIE, then the ISV might have a gateway page that sets a
  cookie called 'namespace', and we set the namespace to the cookie's value
  """
  pass
'''

def private():
	name = None

	if _NAMESPACE_PICKER == _USE_SERVER_NAME:
		name = os.environ['SERVER_NAME']
	elif _NAMESPACE_PICKER == _USE_GOOGLE_APPS_DOMAIN:
		name = namespace_manager.google_apps_namespace()
	elif _NAMESPACE_PICKER == _USE_COOKIE:
		cookies = os.environ.get('HTTP_COOKIE', None)
		if cookies:
			name = Cookie.BaseCookie(cookies).get('namespace')
	return name

def at_local(method):
	"""
		Декоратор для вызова методов в локальном пространстве имен
		Похоже что обращения через Query коррентно работают в локальном пространстве имен только если внутри пространства выполнен fetch()
	"""
	def wrapper(*args, **kwargs):
		namespace = namespace_manager.get_namespace();
		namespace_manager.set_namespace(private());
		try:
			res = method(*args, **kwargs)
		finally:
			namespace_manager.set_namespace(namespace)
		return res

	return wrapper

def at_global(method):
	"""
		Декоратор для принудительного вызова методов в глобальном пространстве имен
		Похоже что обращения через Query коррентно работают в локальном пространстве имен только если внутри пространства выполнен fetch()
	"""
	def wrapper(*args, **kwargs):
		namespace = namespace_manager.get_namespace();
		namespace_manager.set_namespace(None);
		try:
			res = method(*args, **kwargs)
		finally:
			namespace_manager.set_namespace(namespace)
		return res

	return wrapper
