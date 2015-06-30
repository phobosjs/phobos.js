'use strict';

var express = require('express');

var DS = require('../initializers/mongoose');
var Server = require('../initializers/express')(express);

var PhobosInstance = { schema: false, scope: [] };
var PhobosRouter = require('./router')(Server);

exports.addMiddleware = PhobosRouter.registerMiddleware;
exports.server = Server;
exports.DS = DS;
exports.generateToken = require('./bearer').generate;
exports.verifyToken = require('./bearer').decode;

exports.addController = function(controller) {
  PhobosRouter.route(controller(DS));
};

exports.addSchema = function(schema) {
  if (typeof schema !== 'function') return false;
  PhobosInstance.schema = schema;
};

exports.addScopeManifest = function(manifest) {
  if (!Array.isArray(manifest)) return false;
  PhobosInstance.scope = manifest;
};

exports.start = function(options) {
  var port = process.env.PORT || 9292;

  Server.listen(port, function() {
    console.log('=> Phobos.js server running on port ' + port);
  });
};
