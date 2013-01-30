var net = require('net'),
  noredis = require('../libs/noredis'),
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

// see http://redis.io/topics/protocol

var MULTIBULK = '*';//.charCodeAt(0);
var BULK = '$';//.charCodeAt(0);
var CR = '\r';//.charCodeAt(0);
var LF = '\n';//.charCodeAt(0);

var argsBuffer = [], multiBulkCount = 0, bulkCount = 0;

function parseRequest(data, callback) {
  if (multiBulkCount === 0 && data.charAt(0) !== MULTIBULK && data.charAt(0) !== BULK) {
    // legacy request format: a command and args in a line
    _DEBUG && console.log('parsing legacy request:', data);
    callback(data.replace('\r\n', '').split(' '));
    return true;
  }

  // TODO: robust parsing with error detection
  _DEBUG && console.log('parsing new unified request:', data);
  data.split('\r\n').forEach(function (line) {
    _DEBUG && console.log('parsing line:', line, 'multiBulkCount:', multiBulkCount, 'bulkCount:', bulkCount);
    if (line.length === 0) {
      return;
    }
    if (multiBulkCount > 0 && bulkCount > 0) {
      _DEBUG && console.log('parsed arg=', line);
      argsBuffer.push(line);
      bulkCount = 0;
      multiBulkCount -= 1;
      if (multiBulkCount === 0) {
        callback(argsBuffer);
      }
      return;
    }
    switch (line.charAt(0)) {
      case MULTIBULK:
        if (multiBulkCount > 0) {
          throw 'expected \'$\', got \'' + line + '\'';
        }
        multiBulkCount = parseInt(line.substring(1), 10);
        if (isNaN(multiBulkCount) || multiBulkCount <= 0) {
          throw 'Protocol Error: invalid multibulk';
        }
        argsBuffer = [];
        _DEBUG && console.log('parsed multibulk:', multiBulkCount);
        break;
      case BULK:
        if (multiBulkCount === 0) {
          throw 'unknown command \'' + line + '\'';
        }
        bulkCount = parseInt(line.substring(1), 10);
        if (isNaN(bulkCount) || bulkCount <= 0) {
          throw 'Protocol Error: invalid bulk length';
        }
        _DEBUG && console.log('parsed bulk:', bulkCount);
        break;
      default:
        _DEBUG && console.log('parsed arg=', line);
        argsBuffer.push(line);
        bulkCount = 0;
        multiBulkCount -= 1;
        if (multiBulkCount === 0) {
          callback(argsBuffer);
        }
        break;
    }
  });
}

function replyStatus(out, status) {
  _DEBUG && console.log('*** status reply:', status);
  out.write('+');
  out.write((typeof status === 'string') ? status : 'OK');
  out.write('\r\n');
}

function replyError(out, message, error) {
  _DEBUG && console.log('*** error reply:', message, error);
  out.write('-');
  out.write((typeof error === 'string') ? error : 'ERR');
  if (typeof message === 'string') {
    out.write(' ');
    out.write(message);
  }
  out.write('\r\n');
}
function replyInteger(out, int) {
  _DEBUG && console.log('*** integer reply:', int);
  out.write(':');
  out.write(String(int));
  out.write('\r\n');
}

function replyBulk(out, arg) {
  _DEBUG && console.log('*** bulk reply:', arg);
  out.write('$');
  if (typeof arg !== 'undefined') {
    out.write(String(String(arg).length));
    out.write('\r\n');
    out.write(String(arg));
    out.write('\r\n');
  } else {
    out.write('-1\r\n'); // null bulk reply
  }
}

function replyMultiBulk(out, args) {
  _DEBUG && console.log('*** multi bulk reply:', args);
  out.write('*');
  if (typeof args !== 'undefined') {
    out.write(String(args.length));
    out.write('\r\n');
    args.forEach(function (arg) {
      replyBulk(out, arg);
    });
  } else {
    out.write('-1\r\n'); // null multi bulk reply
  }
}

function callbackForIntegerReply(out) {
  return function (err, reply) {
    if (err) {
      _DEBUG && console.log('reply error:', err);
      return;
    }
    replyInteger(out, reply);
  };
}

function callbackForBulkReply(out) {
  return function (err, reply) {
    if (err) {
      _DEBUG && console.log('reply error:', err);
      return;
    }
    replyBulk(out, reply);
  };
}

function callbackForMultiBulkReply(out) {
  return function (err, reply) {
    if (err) {
      _DEBUG && console.log('reply error:', err);
      return;
    }
    replyMultiBulk(out, reply);
  };
}

function verifyArgCount(args, requiredArgCount) {
  if (args.length !== requiredArgCount) {
    throw '-ERR wrong number of arguments for \'' + args[0] + '\' command';
  }
}

var commandHandlers = {
  'quit': function (out, args) {
    verifyArgCount(args, 0);
    replyStatus(out);
    return true; // quit
  },
  'ping': function (out, args) {
    verifyArgCount(args, 0);
    replyStatus(out, 'PONG');
  },
  'info': function (out, args) {
    verifyArgCount(args, 0);
    replyBulk(out, 'redis_version:2.0.0\r\nnoredis_version:0.0.1\r\n');
  },
  'flushall': function (out, args) {
    verifyArgCount(args, 0);
    noredis.flushall();
    replyStatus(out);
  },
  'flushdb': function (out, args) {
    verifyArgCount(args, 0);
    noredis.flushall();
    replyStatus(out);
  },
  'set': function (out, args) {
    verifyArgCount(args, 2);
    noredis.set(args[0], args[1]);
    replyStatus(out);
  },
  'get': function (out, args) {
    verifyArgCount(args, 1);
    noredis.get(args[0], callbackForBulkReply(out));
  },
  'incr': function (out, args) {
    verifyArgCount(args, 1);
    noredis.incr(args[0], callbackForIntegerReply(out));
  },
  'keys': function (out, args) {
    verifyArgCount(args, 1);
    noredis.keys(args[0], callbackForMultiBulkReply(out));
  },
  'decr': function (out, args) {
    verifyArgCount(args, 1);
    noredis.decr(args[0], callbackForIntegerReply(out));
  },
  '': function (out, args) {
  }
};

function createServer() {
  return net.createServer(function (socket) {
    socket.setNoDelay(true);
    socket.setEncoding('utf8');

    socket.on('data', function (data) {
      try {
        parseRequest(data, function (args) {
          _DEBUG && console.log('parsed command: ', args);
          var command = args[0].toLowerCase();
          var commandHandler = commandHandlers[command];
          if (commandHandler) {
            if (commandHandler(socket, args.slice(1))) {
              socket.end();
            }
          } else {
            throw 'unknown command \'' + args[0] + '\'';
          }
        });
      } catch (e) {
        replyError(socket, e);
        socket.end();
      } finally {
        //
      }
    });

  }).listen(6379);
}

exports.createServer = createServer;

if (require.main === module) {
  createServer();
}
