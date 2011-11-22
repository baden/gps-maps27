def webapp_add_wsgi_middleware(app):
    #import os
    #from google.appengine.api import namespace_manager
    #namespace_manager.set_namespace(os.environ['SERVER_NAME'])
    from google.appengine.ext.appstats import recording
    app = recording.appstats_wsgi_middleware(app)
    return app


import os
import Cookie
from google.appengine.api import namespace_manager

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

