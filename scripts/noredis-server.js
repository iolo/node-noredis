var net = require('net'),
  noredis = require('../libs/noredis'),
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

// see http://redis.io/topics/protocol

var argc = 0, argl = 0;
var args = [];

var MULTIBULK = '*'.charCodeAt(0);
var BULK = '$'.charCodeAt(0);

function parseRequest(data) {
  var line = data.toString('utf8');
  if (argc === 0 && data[0] !== MULTIBULK && data[0] !== BULK) {
    // legacy request format: a command and args in a line
    args = line.replace('\r\n', '').split(' ');
    return true;
  }

  // TODO: robust parsing with error detection
  line.split('\r\n').forEach(function (line) {
    _DEBUG && console.log('***line=', line);
    if (line.length === 0) {
      return;
    }
    switch (line.charCodeAt(0)) {
      case MULTIBULK:
        if (argc > 0) {
          throw 'expected \'$\', got \'' + line + '\'';
        }
        argc = parseInt(line.substring(1), 10);
        if (isNaN(argc) || argc <= 0) {
          throw 'Protocol Error: invalid multibulk';
        }
        args = [];
        _DEBUG && console.log('***argc=', argc);
        break;
      case BULK:
        if (argc === 0) {
          throw 'unknown command \'' + line + '\'';
        }
        argl = parseInt(line.substring(1), 10);
        if (isNaN(argl) || argl <= 0) {
          throw 'Protocol Error: invalid bulk length';
        }
        _DEBUG && console.log('***argl=', argl);
        break;
      default:
        _DEBUG && console.log('***arg=', line);
        args.push(line);
        argc -= 1;
        argl = 0;
        break;
    }
  });

  // parse complete or continue
  return (argc === 0);
}

function replyStatus(out, status) {
  out.write('+');
  out.write(status || 'OK');
  out.write('\r\n');
}

function replyError(out, message, error) {
  out.write('-');
  out.write(error || 'ERR');
  if (message) {
    out.write(' ');
    out.write(message);
  }
  out.write('\r\n');
}
function replyInteger(out, int) {
  out.write(':');
  out.write(String(int));
  out.write('\r\n');
}
function replyBulk(out, arg) {
  out.write('$');
  out.write(String(arg.length));
  out.write('\r\n');
  out.write(arg);
  out.write('\r\n');
}

function replyMultiBulk(out, args) {
  out.write('*');
  out.write(String(args.length));
  out.write('\r\n');
  args.forEach(function (arg) {
    replyBulk(out, arg);
  });
}

function proxyCallbackForBulkReply(out) {
  return function (err, reply) {
    replyBulk(out, reply);
    replyStatus(out);
  };
}

function proxyCallbackForIntegerReply(out) {
  return function (err, reply) {
    replyInteger(out, reply);
    replyStatus(out);
  };
}

function verifyArgCount(requiredArgCount) {
  if (args.length !== requiredArgCount) {
    throw '-ERR wrong number of arguments for \'' + args[0] + '\' command';
  }
}

net.createServer(function (socket) {
  socket.setNoDelay(true);

  socket.on('data', function (data) {
    try {
      if (!parseRequest(data)) {
        // command not complete... need more args
        return;
      }

      switch (args[0].toLowerCase()) {
        case 'quit':
          verifyArgCount(1);
          replyStatus(socket);
          socket.end();
          break;
        case 'ping':
          verifyArgCount(1);
          replyStatus(socket, 'PONG');
          break;
        case 'info':
          verifyArgCount(1);
          replyBulk(socket, 'redis_version:2.0.0\r\nnoredis_version:0.0.1\r\n');
          break;
        case 'flushall':
          verifyArgCount(1);
          noredis.flushall();
          replyStatus(socket);
          break;
        case 'flushdb':
          verifyArgCount(1);
          noredis.flushall();
          replyStatus(socket);
          break;
        case 'set':
          verifyArgCount(3);
          noredis.set(args[1], args[2]);
          replyStatus(socket);
          break;
        case 'get':
          verifyArgCount(2);
          noredis.get(args[1], proxyCallbackForBulkReply(socket));
          break;
        case 'incr':
          verifyArgCount(2);
          noredis.incr(args[1], proxyCallbackForIntegerReply(socket));
          break;
        case 'decr':
          verifyArgCount(2);
          noredis.decr(args[1], proxyCallbackForIntegerReply(socket));
          break;
        case '':
          break;
        default:
          replyError(socket, 'unknown command \'' + args[0] + '\'');
      }
    } catch (e) {
      replyError(socket, e);
      socket.end();
    } finally {

    }
  });

}).listen(6379);
