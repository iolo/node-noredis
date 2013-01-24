'use strict';

// this is the shared storage!! just an object ;)
var storage = {};

module.exports = {
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
    var reply = ++storage[key];
    callback && callback(null, reply);
  },
  decr:function (key, callback) {
    var reply = --storage[key];
    callback && callback(null, reply);
  },
  echo:function (message, callback) {
    var reply = message;
    callback && callback(null, reply);
  }
  // TODO: ... more commands
};
