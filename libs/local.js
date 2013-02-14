'use strict';

var
  fs = require('fs'),
  storage = {}, // this is the shared storage!! just an object ;)
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

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
  },
  // TODO: ... more commands
  _loadStorage: function (filename) {
    if (fs.existsSync(filename)) {
      _DEBUG && console.log('load noredis storage from:', filename);
      storage = JSON.parse(fs.readFileSync(filename, 'utf8'));
    } else {
      _DEBUG && console.log('no file to load noredis storage from:', filename);
    }
  },
  _saveStorage: function (filename, callback) {
    _DEBUG && console.log('save noredis storage into:', filename);
    fs.writeFile(filename, JSON.stringify(storage), 'utf8', callback);
  }
};
