var net = require('net'),
    noredis = require('noredis');

net.createServer(function (socket) {
  socket.write('Welcome to noredis!\n');

  socket.on('data', function (data) {
    var line = data.toString('utf8').replace(/\r\n/, '');
    var args = line.split(' \t');
    if (line == 'set') {
      socket.write('world');
    } else if (line == 'bye') {
      socket.write('bye~\n');
      socket.end();
    } else {
      socket.write('what??\n');
    }
  });

}).listen(6379);

