'use strict';
var
  cluster = require('cluster'),
  noredis = require('../libs/noredis');

if (cluster.isMaster) {
  var numWorkers = 2;

  for (var i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }
} else {
  var
    http = require('http'),
    url = require('url'),
    me = cluster.worker.id;

  http.createServer(function(req, res) {
    var parsed = url.parse(req.url, true);
    if (parsed.pathname === '/set') {
      var foo = parsed.query.foo;
      noredis.set('foo', foo);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('worker#' + me + ': set ' + foo + '\n');
    } else if (parsed.pathname === '/del') {
      var foo = parsed.query.foo;
      noredis.del('foo', function (err, reply) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('worker#' + me + ': del ' + reply + '\n');
      });
    } else if (parsed.pathname === '/get') {
      noredis.get('foo', function (err, reply) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('worker#' + me + ': get ' + reply + '\n');
      });
    } else if (parsed.pathname === '/incr') {
      noredis.incr('foo', function (err, reply) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('worker#' + me + ': incr ' + reply + '\n');
      });
    } else if (parsed.pathname === '/decr') {
      noredis.decr('foo', function (err, reply) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('worker#' + me + ': decr ' + reply + '\n');
      });
    }
  }).listen(1337);
}

