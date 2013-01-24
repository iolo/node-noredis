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
  module.exports = require('./local');

} else if (cluster.isWorker) {
  _DEBUG && console.log('NOREDIS WORKER#' + cluster.worker.id);

  // for worker -  stub(ipc client)
  module.exports = require('./stub');
}
