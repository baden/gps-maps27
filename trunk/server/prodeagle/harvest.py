#!/usr/bin/env python
#
# Copyright 2011 MiuMeet AG.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#from django.utils import simplejson
import json as simplejson
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from google.appengine.api import users
from google.appengine.ext import webapp
#import webapp2 as webapp
from google.appengine.ext.webapp import util

import logging
import sets
import datetime
import time

from prodeagle import auth, counter_names

MAX_LOOK_BACK = 3600
EXPECTED_MEMCACHE_SERVERS = 1024

class HarvestHandler(webapp.RequestHandler):
  
  def wasDataLostSinceLastHarvest(self, namespace, slot,
                                  reset_test_counters=False):
    lost_data_check_keys = [ "last_slot_%d" % x
                             for x in range(EXPECTED_MEMCACHE_SERVERS) ]
    lost_data_check = memcache.get_multi(lost_data_check_keys,
                                         namespace=namespace)

    if reset_test_counters:
      memcache.delete_multi(lost_data_check_keys, namespace=namespace)
      next_lost_data = {}
      for key in lost_data_check_keys:
        next_lost_data[key] = 1
      memcache.offset_multi(next_lost_data,
                            namespace=namespace,
                            initial_value=0)
    
    if len(lost_data_check) != len(lost_data_check_keys):
      logging.warning("ProdEagle counters lost before %d" % slot)
      return True
    return False
  
  def createReport(self, production_call=False):
    slot = counter_names.getEpochRounded()
    result = { "time": slot,
               "counters": {},
               "ms_of_data_lost": 0,
               "version": 1.0 }
    cnm = counter_names.getDefaultCounterNamesManager()
    last_slot = int(self.request.get("last_time", 
        str(counter_names.getEpochRounded(
            datetime.datetime.now() - datetime.timedelta(0, MAX_LOOK_BACK)))))
    
    result["all_data_inaccurate"] = self.wasDataLostSinceLastHarvest(
                                        cnm.namespace,
                                        slot,
                                        production_call)        
    all_keys = cnm.all()
    update_keys = sets.Set()
    updates = []
    while slot >= last_slot:
      gap = time.time()      
      slot_updates = memcache.get_multi(all_keys, key_prefix=str(slot),
                                        namespace=cnm.namespace)
      # NOTE(andrin): Between get_multi and delete_multi we loose all updates!
      if production_call:
        memcache.delete_multi(slot_updates.keys(), key_prefix=str(slot),
                              namespace=cnm.namespace)
      result["ms_of_data_lost"] = max(int((time.time() - gap) * 1000),
                                      result["ms_of_data_lost"])
      updates += [(slot, slot_updates)]
      update_keys = update_keys.union(slot_updates.keys())
      slot -= counter_names.MIN_SLOT_SIZE
    
    result["all_data_inaccurate"] |= self.wasDataLostSinceLastHarvest(
                                         cnm.namespace, slot)
    
    for key in update_keys:
      if key not in result["counters"]:
        result["counters"][key] = {}
      for (slot, slot_updates) in updates:
        delta = int(slot_updates.get(key, "0"))
        if delta:
          result["counters"][key][slot] = delta
    if production_call or self.request.get("json"):
      self.response.headers['Content-Type'] = "text/plain; charset=utf-8"
      self.response.out.write(simplejson.dumps(result,
                                               sort_keys=True, indent=2))
    else:
      self.response.out.write("<h3>Data since last export: %s UTC</h3>" %
          datetime.datetime.fromtimestamp(last_slot))
      self.response.out.write(
          "<a href='http://www.prodeagle.com'>Go to ProdEagle dashboard</a>")
      self.response.out.write(
          "<br><br><a href='%s'>Logout</a>" %
          users.create_logout_url(self.request.url))
      for counter in sorted(result["counters"].keys()):
        self.response.out.write("<br/><b>%s</b>: %d" %
            (counter, sum(result["counters"][counter].values())))

  def get(self):
    add_user = self.request.get("administrator") or self.request.get("viewer")
    if add_user:
      auth.addUser(self, add_user)
    elif auth.isProdEagle(self) or auth.isAdministrator(self):
      self.createReport(self.request.get("production_call") == "1")

  def post(self):
    self.get()

application = webapp.WSGIApplication([
  ('/.*', HarvestHandler),
], debug=True)


def main():
  util.run_wsgi_app(application)

if __name__ == "__main__":
  main()