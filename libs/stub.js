'use strict';

var
  events = require('events'),
  dispatcher = new events.EventEmitter(),
  uniqMsgId = 0,
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

function sendToMaster(cmd, msg, callback) {
  msg.noredis = cmd;
  if (callback) {
    msg.callback = 'noredis-' + cmd + '-reply-' + (++uniqMsgId);
    dispatcher.once(msg.callback, function (msg) {
      callback(null, msg.reply);
    });
  }
  process.send(msg);
}

process.on('message', function (msg) {
  if (msg.noredis) {
    _DEBUG && console.log('WORKER#' + cluster.worker.id + ' GOT NOREDIS MESSAGE FROM MASTER: ', msg);
    dispatcher.emit(msg.noredis, msg);
  }
});

module.exports = {
  flushall:function () {
    sendToMaster('flushall', {});
  },
  flushdb:function () {
    sendToMaster('flushdb', {});
  },
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
  keys:function (pattern, callback) {
    sendToMaster('keys', { pattern:pattern }, callback);
  },
  echo:function (message, callback) {
    sendToMaster('echo', { message:message }, callback);
  }
  // TODO: ... more commands
};
