'use strict';
var noredis = require('../libs/noredis'),
    http = require('http'),
    url = require('url');

http.createServer(function(req, res) {
  var parsed = url.parse(req.url, true);
  if (parsed.pathname === '/set') {
    var foo = parsed.query.foo;
    noredis.set('foo', foo);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('set ' + foo + '\n');
  } else if (parsed.pathname === '/del') {
    var foo = parsed.query.foo;
    noredis.del('foo', function (err, reply) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('del ' + reply + '\n');
    });
  } else if (parsed.pathname === '/get') {
    noredis.get('foo', function (err, reply) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('get ' + reply + '\n');
    });
  } else if (parsed.pathname === '/incr') {
    noredis.incr('foo', function (err, reply) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('incr ' + reply + '\n');
    });
  } else if (parsed.pathname === '/decr') {
    noredis.decr('foo', function (err, reply) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('decr ' + reply + '\n');
    });
  }
}).listen(1337);
