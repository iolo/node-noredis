'use strict';

var local = require('../libs/local');

module.exports = {
  setUp:function (callback) {
    local.set('foo', 'bar');
    local.set('baz', 100);
    callback();
  },
  tearDown:function (callback) {
    callback();
  },
  testGetString:function (test) {
    local.get('foo', function (err, reply) {
      test.equal('bar', reply);
      test.done();
    });
  },
  testGetNumber:function (test) {
    local.get('baz', function (err, reply) {
      test.equal(100, reply);
      test.done();
    });
  },
  testDel:function (test) {
    local.del('foo', function (err, reply) {
      test.equal(1, reply);
      test.done();
    });
  },
  testExists:function (test) {
    local.exists('foo', function (err, reply) {
      test.ok(reply);
      test.done();
    });
  },
  testExistsNotExists:function (test) {
    local.exists('this-is-not-exists', function (err, reply) {
      test.ok(!reply);
      test.done();
    });
  },
  testIncr:function (test) {
    local.incr('baz', function (err, reply) {
      test.equal(101, reply);
      test.done();
    });
  },
  testDecr:function (test) {
    local.decr('baz', function (err, reply) {
      test.equal(99, reply);
      test.done();
    });
  },
  testIncrDecr:function (test) {
    local.incr('baz');
    local.decr('baz');
    local.get('baz', function (err, reply) {
      test.equal(100, reply);
      test.done();
    });
  },
  testIncrMultiple:function (test) {
    for (var i = 0; i < 100; i++) {
      local.incr('baz');
    }
    local.get('baz', function (err, reply) {
      test.equal(200, reply);
      test.done();
    });
  },
  testDecrMultiple:function (test) {
    for (var i = 0; i < 100; i++) {
      local.decr('baz');
    }
    local.get('baz', function (err, reply) {
      test.equal(0, reply);
      test.done();
    });
  },
  testIncrDecrMultiple:function (test) {
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
  testEcho:function (test) {
    local.echo('hello', function (err, reply) {
      test.equal('hello', reply);
      test.done();
    });
  }
};