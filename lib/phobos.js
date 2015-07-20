'use strict';

if (!process.env.BEARER_SIGNATURE) process.env.BEARER_SIGNATURE = '123';

var express = require('express');

var DS = null;
var Server = require('../initializers/express')(express);

var PhobosInstance = { schema: false, scope: [], scopable: false };
var PhobosRouter = require('./router')(Server);
var BearerToken = require('./bearer');

var accessorForDS = function() {
  return DS;
}

exports.addMiddleware = PhobosRouter.registerMiddleware;
exports.server = Server;
exports.generateToken = BearerToken.generate;
exports.verifyToken = BearerToken.decode;
exports.addErrorHandler = PhobosRouter.addErrorHandler;

exports.DS = accessorForDS();

exports.addController = function(controller) {
  PhobosRouter.addController(controller);
};

exports.addSchema = function(schema) {
  if (typeof schema !== 'function') return false;
  PhobosInstance.schema = schema;
  DS = require('../initializers/mongoose')(PhobosInstance.schema);
  return DS;
};

exports.addScopeManifest = function(manifest) {
  PhobosInstance.scope = manifest;
};

exports.start = function(options) {
  var port = process.env.PORT || 9292;
  PhobosRouter.mount(DS, PhobosInstance);

  Server.listen(port, function() {
    console.log('=> Phobos.js server running on port ' + port);
  });
};

exports.scopeCarrier = function(model, field) {
  PhobosInstance.scopable = { model: model, field: field };
};
