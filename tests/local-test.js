'use strict';

var local = require('../libs/local');

module.exports = {
  setUp: function (callback) {
    local.flushall();
    local.set('foo', 'bar');
    local.set('baz', 100);
    callback();
  },
  tearDown: function (callback) {
    callback();
  },
  testFlushall: function (test) {
    local.flushall();
    local.exists('foo', function (err, reply) {
      test.ok(!reply);
      local.get('baz', function (err, reply) {
        test.ok(!reply);
        test.done();
      });
    });
  },
  testFlushdb: function (test) {
    local.flushdb();
    local.exists('foo', function (err, reply) {
      test.ok(!reply);
      local.get('baz', function (err, reply) {
        test.ok(!reply);
        test.done();
      });
    });
  },
  testGetString: function (test) {
    local.get('foo', function (err, reply) {
      test.equal('bar', reply);
      test.done();
    });
  },
  testGetNumber: function (test) {
    local.get('baz', function (err, reply) {
      test.equal(100, reply);
      test.done();
    });
  },
  testDel: function (test) {
    local.del('foo', function (err, reply) {
      test.equal(1, reply);
      test.done();
    });
  },
  testExists: function (test) {
    local.exists('foo', function (err, reply) {
      test.ok(reply);
      test.done();
    });
  },
  testExistsNotExists: function (test) {
    local.exists('this-is-not-exists', function (err, reply) {
      test.ok(!reply);
      test.done();
    });
  },
  testIncr: function (test) {
    local.incr('baz', function (err, reply) {
      test.equal(101, reply);
      test.done();
    });
  },
  testIncrString: function (test) {
    local.incr('foo', function (err, reply) {
      test.ok(isNaN(reply));
      test.done();
    });
  },
  testIncrNotExist: function (test) {
    local.incr('this-is-not-exists', function (err, reply) {
      test.equal(1, reply);
      test.done();
    });
  },
  testDecr: function (test) {
    local.decr('baz', function (err, reply) {
      test.equal(99, reply);
      test.done();
    });
  },
  testDecrString: function (test) {
    local.decr('foo', function (err, reply) {
      test.ok(isNaN(reply));
      test.done();
    });
  },
  testDecrNotExist: function (test) {
    local.decr('this-is-not-exists', function (err, reply) {
      test.equal(-1, reply);
      test.done();
    });
  },
  testIncrDecr: function (test) {
    local.incr('baz');
    local.decr('baz');
    local.get('baz', function (err, reply) {
      test.equal(100, reply);
      test.done();
    });
  },
  testIncrMultiple: function (test) {
    for (var i = 0; i < 100; i++) {
      local.incr('baz');
    }
    local.get('baz', function (err, reply) {
      test.equal(200, reply);
      test.done();
    });
  },
  testDecrMultiple: function (test) {
    for (var i = 0; i < 100; i++) {
      local.decr('baz');
    }
    local.get('baz', function (err, reply) {
      test.equal(0, reply);
      test.done();
    });
  },
  testIncrDecrMultiple: function (test) {
    for (var i = 0; i < 100; i++) {
      local.incr('baz');
    }
    for (var i = 0; i < 100; i++) {
      local.decr('baz');
    }
    local.get('baz', function (err, reply) {
      test.equal(100, reply);
      test.done();
    });
  },
  testKeys: function (test) {
    local.keys('*', function (err, reply) {
      test.ok(reply instanceof Array);
      test.equal(2, reply.length);
      test.equal('foo', reply[0]);
      test.equal('baz', reply[1]);
      test.done();
    });
  },
  testKeysPrefixMatches: function (test) {
    local.keys('f*', function (err, reply) {
      test.ok(reply instanceof Array);
      test.equal(1, reply.length);
      test.equal('foo', reply[0]);
      test.done();
    });
  },
  testKeysPostfixMatches: function (test) {
    local.keys('*o', function (err, reply) {
      test.ok(reply instanceof Array);
      test.equal(1, reply.length);
      test.equal('foo', reply[0]);
      test.done();
    });
  },
  test_hset: function (test) {
    local.hset('hash', 'foo', 100, function (err, reply) {
      test.equal(reply, 1);
      local.hset('hash', 'foo', 200, function (err, reply) {
        test.equal(reply, 0);
        test.done();
      });
    });
  },
  test_hget: function (test) {
    local.hget('hash', 'foo', function (err, reply) {
      test.equal(reply, undefined);
      local.hset('hash', 'foo', 100, function (err, reply) {
        local.hget('hash', 'foo', function (err, reply) {
          test.equal(reply, 100);
          test.done();
        });
      });
    });
  },
  test_hexists: function (test) {
    local.hexists('hash', 'foo', function (err, reply) {
      test.equal(reply, 0);
      local.hset('hash', 'foo', 100, function (err, reply) {
        local.hexists('hash', 'foo', function (err, reply) {
          test.equal(reply, 1);
          test.done();
        });
      });
    });
  },
  test_hlen: function (test) {
    local.hlen('hash', function (err, reply) {
      test.equal(reply, 0);
      local.hset('hash', 'foo', 100, function (err, reply) {
        local.hset('hash', 'bar', 200, function (err, reply) {
          local.hlen('hash', function (err, reply) {
            test.equal(reply, 2);
            test.done();
          });
        });
      });
    });
  },
  test_hincrby: function (test) {
    local.hincrby('hash', 'foo', 100, function (err, reply) {
      test.equal(reply, 100);
      local.hincrby('hash', 'foo', 100, function (err, reply) {
        test.equal(reply, 200);
        test.done();
      });
    });
  },
  testEcho: function (test) {
    local.echo('hello', function (err, reply) {
      test.equal('hello', reply);
      test.done();
    });
  },
  testSaveAndLoad: function (test) {
    var filename = '/tmp/noredis-storage.json';
    local.get('foo', function (err, reply) {
      test.equal('bar', reply);
      local._saveStorage(filename, function (err) {
        test.ifError(err);
        local.flushall();
        local.get('foo', function (err, reply) {
          test.ok(!reply);
          local._loadStorage(filename);
          local.get('foo', function (err, reply) {
            test.equal('bar', reply);
            test.done();
          });
        });
      });
    });
  }
};
