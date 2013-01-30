'use strict';

// this is the shared storage!! just an object ;)
var storage = {};

module.exports = {
  flushall:function () {
    storage = {};
  },
  flushdb:function () {
    storage = {};
  },
  set:function (key, value) {
    storage[key] = value;
  },
  get:function (key, callback) {
    var reply = storage[key];
    callback && callback(null, reply);
  },
  del:function (key, callback) {
    // TODO: support multiple keys at once
    delete storage[key];
    callback && callback(null, 1);
  },
  exists:function (key, callback) {
    var reply = key in storage;
    callback && callback(null, reply);
  },
  incr:function (key, callback) {
    if (!(key in storage)) {
      storage[key] = 0;
    }
    var reply = ++storage[key];
    callback && callback(null, reply);
  },
  decr:function (key, callback) {
    if (!(key in storage)) {
      storage[key] = 0;
    }
    var reply = --storage[key];
    callback && callback(null, reply);
  },
  keys:function (pattern, callback) {
    // TODO: need robust pattern parsing! esp. on backslash escape handling
    var re = new RegExp(pattern.replace('?', '.').replace('*', '.*'));
    var reply = [];
    for (var key in storage) {
      if (re.test(key)) {
        reply.push(key);
      }
    }
    callback && callback(null, reply);
  },
  echo:function (message, callback) {
    var reply = message;
    callback && callback(null, reply);
  }
  // TODO: ... more commands
};
