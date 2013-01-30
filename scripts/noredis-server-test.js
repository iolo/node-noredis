'use strict';

var
  redis = require('redis'),
  noredisServer = require('./noredis-server'),
  client, server;

module.exports = {
  setUp: function (callback) {
    server = noredisServer.createServer();
    client = redis.createClient();
    client.set('foo', 'bar');
    client.set('baz', 100);
    callback();
  },
  tearDown: function (callback) {
    client.quit();
    server.close();
    callback();
  },
  testGet: function (test) {
    client.get('foo', function (err, reply) {
      test.ifError(err);
      test.equal('bar', reply);
      test.done();
    });
  },
  testKeys: function (test) {
    client.keys('*', function (err, reply) {
      test.ifError(err);
      test.ok(reply instanceof Array);
      test.equal(2, reply.length);
      test.ok(reply.indexOf('foo') >= 0);
      test.ok(reply.indexOf('baz') >= 0);
      test.done();
    });
  }
};
