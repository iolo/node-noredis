'use strict';

var
  cluster = require('cluster'),
  events = require('events'),
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

if (cluster.isMaster) {
  _DEBUG && console.log('NOREDIS MASTER!');

  // this is the shared storage!! just an object ;)
  var storage = {};

  // non-cluster impl.
  var local = {
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
  };

  cluster.on('fork', function (worker) {
    _DEBUG && console.log('NEW NOREDIS WORKER#' + worker.id + ' FORK!');

    worker.on('message', function (msg) {
      if (msg.noredis) {
        _DEBUG && console.log('MASTER GOT NOREDIS MESSAGE FROM WORKER#' + worker.id + ':', msg);

        if (msg.noredis) {
          var callbackToWorker;
          if (msg.callback) {
            callbackToWorker = function (err, reply) {
              worker.send({noredis:msg.callback, reply:reply});
            };
          } else {
            callbackToWorker = null; // no-callback
          }
          switch (msg.noredis) {
            case 'set':
              local.set(msg.key, msg.value, callbackToWorker);
              break;
            case 'get':
              local.get(msg.key, callbackToWorker);
              break;
            case 'del':
              local.del(msg.key, callbackToWorker);
              break;
            case 'exists':
              local.exists(msg.key, callbackToWorker);
              break;
            case 'incr':
              local.incr(msg.key, callbackToWorker);
              break;
            case 'decr':
              local.decr(msg.key, callbackToWorker);
              break;
            case 'echo':
              local.echo(msg.message, callbackToWorker);
              break;
          }
        }
      }
    });
  });

  cluster.on('exit', function (worker) {
    _DEBUG && console.log('WORKER#' + worker.id + ' EXIT!');
  });

  module.exports = local;
}
else if (cluster.isWorker) {
  _DEBUG && console.log('NOREDIS WORKER#' + cluster.worker.id);

  var
    uniqMsgId = 0,
    dispatcher = new events.EventEmitter();

  process.on('message', function (msg) {
    if (msg.noredis) {
      _DEBUG && console.log('WORKER#' + cluster.worker.id + ' GOT NOREDIS MESSAGE FROM MASTER: ', msg);

      dispatcher.emit(msg.noredis, msg);
    }
  });

  var sendToMaster = function (cmd, msg, callback) {
    msg.noredis = cmd;
    if (callback) {
      msg.callback = 'noredis-' + cmd + '-reply-' + (++uniqMsgId);
      dispatcher.once(msg.callback, function (msg) {
        callback(null, msg.reply);
      });
    }
    process.send(msg);
  };

  module.exports = {
    set:function (key, value) {
      sendToMaster('set', { key:key, value:value });
    },
    get:function (key, callback) {
      sendToMaster('get', { key:key }, callback);
    },
    del:function (key, callback) {
      sendToMaster('del', { key:key }, callback);
    },
    incr:function (key, callback) {
      sendToMaster('incr', { key:key }, callback);
    },
    decr:function (key, callback) {
      sendToMaster('decr', { key:key }, callback);
    },
    exists:function (key, callback) {
      sendToMaster('exists', { key:key }, callback);
    },
    echo:function (message, callback) {
      sendToMaster('echo', { message:message }, callback);
    }
    // TODO: ... more commands
  };
}
