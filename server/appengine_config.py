# -*- coding: utf-8 -*-

import logging
import os
import Cookie
#from google.appengine.api import namespace_manager
import re
from google.appengine.ext.appstats import recording

#logging.getLogger().setLevel(logging.WARNING)
logging.info('Loading %s from %s', __name__, __file__)

#apptrace_URL_PATTERNS  = ['^/$']
#apptrace_TRACE_MODULES = ['api.py']

def webapp_add_wsgi_middleware(app):
    app = recording.appstats_wsgi_middleware(app)
    return app

#os.environ['ROOT_NAMESPACE'] = 'point'

appstats_DEBUG = False
appstats_TZOFFSET = -2*3600
appstats_DUMP_LEVEL = -1
appstats_FILTER_LIST = [{'PATH_INFO': '!^/favicon\.ico$'}]


"""
appstats_stats_url = '/_ah/stats'

# Custom Appstats path normalization.
def appstats_normalize_path(path):
    logging.info('====**==== appstats_normalize_path (%s): %s from %s', repr(path), __name__, __file__)
    if path.startswith('/api/'):
        return '/api/...'
    if path.startswith('/user_popup/'):
        return '/user_popup/X'
    if path.startswith('/info/'):
        i = path.find('/', 5)
        if i > 0:
            return path[:i] + '/X'
    return re.sub(r'\d+', 'X', path)
"""

'''
_USE_SERVER_NAME = 0
_USE_GOOGLE_APPS_DOMAIN = 1
_USE_COOKIE = 2

_NAMESPACE_PICKER = _USE_SERVER_NAME

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

'''
