noredis
=======

*This is extremely experimental stuff*

This is a simple "shared storage" for workers in nodejs cluster without redis-like daemon.

Features
--------

* set
* get
* incr
* decr
* TODO: ....

How to Use
----------

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

see [examples/server.js](http://github.com/iolo/node-noredis/blob/master/examples/server.js)

