'use strict';

var
  cluster = require('cluster'),
  _DEBUG = !!process.env['NOREDIS_DEBUG'];

if (cluster.isMaster) {
  _DEBUG && console.log('NOREDIS MASTER!');

  cluster.on('fork', function (worker) {
    _DEBUG && console.log('NEW NOREDIS WORKER#' + worker.id + ' FORK!');

    // skeleton(ipc server) for worker
    require('./skel')(worker);
  });

  cluster.on('exit', function (worker) {
    _DEBUG && console.log('WORKER#' + worker.id + ' EXIT!');
  });

  // for non-cluster(master only) environment
  var local = require('./local');
  module.exports = local;
  module.exports.configure = function(config) {
    if (config) {
      if (config.persist) {
        var filename = config.filename || './noredis-storage.json';
        var interval = config.interval || 10000;
        local._loadStorage(filename);
        setInterval(function () {
          local._saveStorage(filename, function (err) {
            if (err) {
              return console.error('failed to save noredis storage!');
            }
            _DEBUG && console.log('succeed to save noredis storage.');
          });
        }, interval);
      }
    }
    return local;
  };

} else if (cluster.isWorker) {
  _DEBUG && console.log('NOREDIS WORKER#' + cluster.worker.id);

  // for worker -  stub(ipc client)
  var stub = require('./stub');
  module.exports = stub;
  module.exports.configure = function(config) {
    // no configurable options yet for worker ;)
    return stub;
  };
}
