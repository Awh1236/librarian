/*jshint strict:true, trailing:false, unused:true, node:true */
'use strict';

require("babel/register");

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var workers = process.env.WEB_CONCURRENCY;

console.log('CPUs:', numCPUs);
console.log('workers:', workers);

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
    cluster.fork();
  });

} else {

  var express      = require('express');
  var bodyParser   = require('body-parser');
  var serve_static = require('serve-static');
  var session      = require('cookie-session');
  var multer       = require('multer');
  var bugsnag      = require('bugsnag');
  var debug        = require('debug')('librarian');
  var router       = require('./lib/router');
  
  bugsnag.register("b9d5d0c5b9ecdcf14731645900d4f5be");
  
  var app = express();
  app.use(bugsnag.requestHandler);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.set('view engine', 'jade');
  app.use(serve_static('static'));
  app.use(session({secret: 'teprefieroigualinternacional'}));
  app.disable('x-powered-by');
  
  app.get('/', router.index);
  app.get('/repos/:owner/:repo', router.repoInfo);
  app.post('/manifests', [multer({dest: './uploads/'}), router.parseManifests]);
  
  app.use(bugsnag.errorHandler);
  app.use(function(err, req, res, next) {
    console.error('ERR', err);
    res.status(500).send({error: 'Something went wrong.'});
  });
  
  var port = process.env.PORT || 5000;
  app.listen(port, function() {
    console.log('Listening on', port);
  });

}
