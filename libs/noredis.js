'use strict';

var
  cluster = require('cluster'),
  events = require('events'),
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

if (cluster.isMaster) {
  if (_DEBUG) { console.log('NOREDIS MASTER!'); }

  var storage = {};

  var replyToWorker = function (worker, msg, reply) {
    if (msg.callback) {
      worker.send({noredis: msg.callback, reply: storage[msg.key]});
    }
  };

  cluster.on('fork', function (worker) {
    if (_DEBUG) { console.log('NEW NOREDIS WORKER#' + worker.id + ' FORK!'); }

    worker.on('message', function (msg) {
      if (msg.noredis) {
        if (_DEBUG) { console.log('MASTER GOT NOREDIS MESSAGE FROM WORKER#' + worker.id + ':', msg); }

        switch (msg.noredis) {
          case 'set':
            storage[msg.key] = msg.value;
            break;
          case 'get':
            replyToWorker(worker, msg, storage[msg.key]);
            break;
          case 'incr':
            replyToWorker(worker, msg, ++storage[msg.key]);
            break;
          case 'decr':
            replyToWorker(worker, msg, --storage[msg.key]);
            break;
        }
      }
    });
  });

  cluster.on('exit', function (worker) {
    if (_DEBUG) { console.log('WORKER#' + worker.id + ' EXIT!'); }
  });
} else if (cluster.isWorker) {
  if (_DEBUG) { console.log('NOREDIS WORKER#' + cluster.worker.id); }

  var
    uniqMsgId = 0,
    dispatcher = new events.EventEmitter();

  process.on('message', function (msg) {
    if (msg.noredis) {
      if (_DEBUG) { console.log('WORKER#' + cluster.worker.id + ' GOT NOREDIS MESSAGE FROM MASTER: ', msg); }
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

  exports.set = function (key, value) {
    process.send({noredis: 'set', key: key, value: value});
  };

  exports.get = function (key, callback) {
    sendToMaster('get', { key: key }, callback);
  };

  exports.incr = function (key, callback) {
    sendToMaster('incr', { key: key }, callback);
  };

  exports.decr = function (key, callback) {
    sendToMaster('decr', { key: key }, callback);
  };

  // TODO: ... more commands
}
