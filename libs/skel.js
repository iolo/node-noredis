'use strcit';

var
  local = require('./local'), // local(non-cluster) impl.
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

function execute(msg, callback) {
  switch (msg.noredis) {
    case 'set':
      local.set(msg.key, msg.value, callback);
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

