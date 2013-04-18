'use strcit';

var
  local = require('./local'), // local(non-cluster) impl.
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

function execute(msg, callback) {
  switch (msg.noredis) {
    case 'flushall':
      local.flushall();
      break;
    case 'flushdb':
      local.flushdb();
      break;
    case 'set':
      local.set(msg.key, msg.value);
      break;
    case 'get':
      local.get(msg.key, callback);
      break;
    case 'del':
      local.del(msg.key, callback);
      break;
    case 'exists':
      local.exists(msg.key, callback);
      break;
    case 'incr':
      local.incr(msg.key, callback);
      break;
    case 'decr':
      local.decr(msg.key, callback);
      break;
    case 'incrby':
      local.incr(msg.key, msg.increment, callback);
      break;
    case 'decrby':
      local.decr(msg.key, msg.decrement, callback);
      break;
    case 'keys':
      local.keys(msg.pattern, callback);
      break;
    case 'hset':
      local.hset(msg.key, msg.field, msg.value, callback);
      break;
    case 'hget':
      local.hget(msg.key, msg.field, callback);
      break;
    case 'hdel':
      local.hdel(msg.key, msg.field, callback);
      break;
    case 'hexists':
      local.hexists(msg.key, msg.field, callback);
      break;
    case 'hincrby':
      local.hincrby(msg.key, msg.increment, callback);
      break;
    case 'hlen':
      local.hlen(msg.key, callback);
      break;
    case 'hkeys':
      local.hkeys(msg.key, callback);
      break;
    case 'hvals':
      local.hvals(msg.key, callback);
      break;
    case 'hgetall':
      local.hgetall(msg.key, callback);
      break;
    case 'echo':
      local.echo(msg.message, callback);
      break;
    // TODO: ... more commands
  }
}

module.exports = function (worker) {
  worker.on('message', function (msg) {
    if (msg.noredis) {
      _DEBUG && console.log('MASTER GOT NOREDIS MESSAGE FROM WORKER#' + worker.id + ':', msg);

      var callbackToWorker;
      if (msg.callback) {
        callbackToWorker = function (err, reply) {
          worker.send({noredis:msg.callback, reply:reply});
        };
      } else {
        callbackToWorker = null; // no-callback
      }

      execute(msg, callbackToWorker);
    }
  });
}

