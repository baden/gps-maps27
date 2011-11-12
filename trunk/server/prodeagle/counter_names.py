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


from google.appengine.api import namespace_manager
from google.appengine.ext import db
from google.appengine.runtime.apiproxy_errors import RequestTooLargeError

import datetime
import logging
import sets
import time

NAMESPACE = "prodeagle"
MAX_CLOCK_SKEW = 60
MIN_SLOT_SIZE = 60

class CounterNamesManager(object):
  def __init__(self, namespace=NAMESPACE):
    self.known_counter_names_ = sets.Set([])
    self.last_update_ = None 
    self.last_shard_ = None
    self.namespace = namespace

  def all(self):
    namespace = namespace_manager.get_namespace()
    try:
      namespace_manager.set_namespace(self.namespace)
      query = CounterNamesShard.all()
      if self.last_update_:
        query.filter("timestamp >= ",
                     self.last_update_- datetime.timedelta(0, MAX_CLOCK_SKEW))
      for record in query:
        self.known_counter_names_ = self.known_counter_names_.union(
                                        record.names)
        self.last_shard_ = max(self.last_shard_, int(record.key().name()))
        self.last_update_ = datetime.datetime.now()
      return self.known_counter_names_
    finally:
      namespace_manager.set_namespace(namespace)
    
  def addIfNew(self, names):
    new_names = []
    fresh = None
    for name in names:
      if name not in self.known_counter_names_:
        if fresh == None:
          fresh = self.all()
          if name not in fresh:
            new_names += [name] 
        else:
          new_names += [name] 
    if new_names:
      namespace = namespace_manager.get_namespace()
      try:
        namespace_manager.set_namespace(self.namespace)
        if self.last_shard_ == None:
          CounterNamesShard.get_or_insert("0")
          self.last_shard_ = 0
        ADD_SUCCESS = 1
        ADD_FULL = 2
        ADD_FAIL = 3
        def addNames(key, names):
          record = db.get(key)
          local_names = sets.Set(record.names)
          for name in names:
            if name not in local_names:
              local_names.add(name)
              record.names += [name]
          try:
            record.put()
            return ADD_SUCCESS
          except RequestTooLargeError:
            if len(names) == len(record.names):
              return ADD_FAIL
            else:            
              return ADD_FULL
        result = None
        try:
          result = db.run_in_transaction(addNames,
              db.Key.from_path('CounterNamesShard', str(self.last_shard_)),
              new_names)
        except:
          result = ADD_FAIL          
        if result == ADD_FULL:
          CounterNamesShard.get_or_insert(str(self.last_shard_ + 1))
          self.addIfNew(names)
        if result == ADD_SUCCESS:
          logging.info("Registered new counter names: %s." %
                       ",".join(new_names))
        else:
          logging.warning(
              "Coudn't register counter names: %s. (Will retry next time)" %
              ",".join(new_names))
      finally:
        namespace_manager.set_namespace(namespace)
    return (not not fresh, len(new_names))  

class CounterNamesShard(db.Model):  
  names = db.StringListProperty(default=[], indexed=False)
  timestamp = db.DateTimeProperty(auto_now=True)
  
def getDefaultCounterNamesManager():
  return counter_names_manager_

counter_names_manager_ = CounterNamesManager()

def getEpochRounded(utc_datetime=None, slot_size=MIN_SLOT_SIZE):
  if not utc_datetime:
    utc_datetime = datetime.datetime.now()
  slot = int(time.mktime(utc_datetime.timetuple()))
  return (slot - slot % slot_size)

