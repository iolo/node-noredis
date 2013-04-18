noredis
=======

*This is extremely experimental stuff*

This is a simple "shared storage" for nodejs cluster without redis-like daemon.

Features
--------

* set/get/del/exists/incr/decr/incrby/decrby/keys
* hset/hget/hdel/hexists/hincrby/hlen/hkeys/hvals/hgetall
* echo/flushall/flushdb
* TODO: ....
* see also [redis command reference](http://redis.io/commands) for supported commands

Install
-------

```
npm install noredis
```

or

```
npm install git@github.com:iolo/node-noredis.git
```

How to Use(with cluster)
------------------------

1. do ```require('noredis')``` before fork the first worker.
2. use noredis in workers.
3. that's all folks.

```javascript
var cluster = require('cluster'),
    noredis = require('noredis'); // NOTE: before the first fork!

if (cluster.isMaster()) {
  ...
  cluster.fork();
  ...
} else {
  ...
  noredis.set('foo', 123);
  noredis.get('foo', function(err, reply) {
    console.log('foo is ' + reply);
  });
}
```

* see also [examples/cluster.js](http://github.com/iolo/node-noredis/blob/master/examples/cluster.js)

How to Use(without cluster)
---------------------------

1. simply ```require('noredis')``` and use it.
2. that's all ;)

```javascript
var noredis = require('noredis');

...
noredis.set('foo', 123);
noredis.get('foo', function(err, reply) {
console.log('foo is ' + reply);
});
```

* see also [examples/nocluster.js](http://github.com/iolo/node-noredis/blob/master/examples/nocluster.js)

