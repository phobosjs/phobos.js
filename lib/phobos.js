'use strict';

var express = require('express');

var DS = require('../initializers/mongoose');
var Server = require('../initializers/express')(express);

var PhobosInstance = { schema: false, scope: [], scopable: false };
var PhobosRouter = require('./router')(Server);
var BearerToken = require('./bearer');

exports.addMiddleware = PhobosRouter.registerMiddleware;
exports.server = Server;
exports.DS = DS;
exports.generateToken = BearerToken.generate;
exports.verifyToken = BearerToken.decode;

exports.addController = function(controller) {
  PhobosRouter.addController(controller);
};

exports.addSchema = function(schema) {
  if (typeof schema !== 'function') return false;
  PhobosInstance.schema = schema;
};

exports.addScopeManifest = function(manifest) {
  PhobosInstance.scope = manifest;
};

exports.start = function(options) {
  var port = process.env.PORT || 9292;
  DS = require('../initializers/mongoose')(PhobosInstance.schema);
  PhobosRouter.mount(DS, PhobosInstance);

  Server.listen(port, function() {
    console.log('=> Phobos.js server running on port ' + port);
  });
};

exports.scopeCarrier = function(model, field) {
  PhobosInstance.scopable = { model: model, field: field };
};
