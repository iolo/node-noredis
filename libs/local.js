'use strict';

var
  fs = require('fs'),
  storage = {}, // this is the shared storage!! just an object ;)
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

module.exports = {
  _init: function(data) {
    storage = data||{};
  },
  flushall: function () {
    storage = {};
  },
  flushdb: function () {
    storage = {};
  },
  set: function (key, value) {
    storage[key] = value;
  },
  get: function (key, callback) {
    var reply = storage[key];
    callback && callback(null, reply);
  },
  del: function (key, callback) {
    // TODO: support multiple keys at once
    delete storage[key];
    callback && callback(null, 1);
  },
  exists: function (key, callback) {
    var reply = key in storage;
    callback && callback(null, reply);
  },
  incr: function (key, callback) {
    if (!(key in storage)) {
      storage[key] = 0;
    }
    var reply = ++storage[key];
    callback && callback(null, reply);
  },
  decr: function (key, callback) {
    if (!(key in storage)) {
      storage[key] = 0;
    }
    var reply = --storage[key];
    callback && callback(null, reply);
  },
  incrby: function (key, increment, callback) {
    if (!(key in storage)) {
      storage[key] = 0;
    }
    var reply = (storage[key] += increment);
    callback && callback(null, reply);
  },
  decrby: function (key, decrement, callback) {
    if (!(key in storage)) {
      storage[key] = 0;
    }
    var reply = (storage[key] -= decrement);
    callback && callback(null, reply);
  },
  keys: function (pattern, callback) {
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
  hset: function (key, field, value, callback) {
    var reply;
    var obj = storage[key];
    if (obj) {
      reply = (field in obj) ? 0 : 1;
    } else {
      storage[key] = obj = {};
      reply = 1;
    }
    obj[field] = value;
    callback && callback(null, reply);
  },
  hget: function (key, field, callback) {
    var reply;
    var obj = storage[key];
    if (obj) {
      reply = obj[field];
    }
    callback && callback(null, reply);
  },
  hdel: function (key, field, callback) {
    var reply;
    var obj = storage[key];
    if (obj) {
      if (field in obj) {
        reply = 1;
        delete obj[field];
      } else {
        reply = 0;
      }
    } else {
      reply = 0;
    }
    callback && callback(null, reply);
  },
  hexists: function (key, field, callback) {
    var obj = storage[key];
    var reply = (obj && (field in obj)) ? 1 : 0;
    callback && callback(null, reply);
  },
  hincrby: function (key, field, increment, callback) {
    var obj = storage[key];
    if (!obj) {
      storage[key] = obj = {};
    }
    if (!(key in obj)) {
      obj[key] = 0;
    }
    var reply = (obj[key] += increment);
    callback && callback(null, reply);
  },
  hlen: function (key, callback) {
    var reply = 0;
    var obj = storage[key];
    if (obj) {
      for (var key in obj) {
        ++reply;
      }
    }
    callback && callback(null, reply);
  },
  hkeys: function (key, callback) {
    var reply = [];
    var obj = storage[key];
    if (obj) {
      for (var key in obj) {
        reply.push(key);
      }
    }
    callback && callback(null, reply);
  },
  hvals: function (key, callback) {
    var reply = [];
    var obj = storage[key];
    if (obj) {
      for (var key in obj) {
        reply.push(obj[key]);
      }
    }
    callback && callback(null, reply);
  },
  hgetall: function (key, callback) {
    var reply = [];
    var obj = storage[key];
    if (obj) {
      for (var key in obj) {
        reply.push(key);
        reply.push(obj[key]);
      }
    }
    callback && callback(null, reply);
  },
  echo: function (message, callback) {
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
