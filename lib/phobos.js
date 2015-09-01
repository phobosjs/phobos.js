'use strict';

if (!process.env.BEARER_SIGNATURE) process.env.BEARER_SIGNATURE = '123';

var express = require('express');
var Server = require('../initializers/express')(express);
var BearerToken = require('../middleware/bearer');

function Phobos() {
  this.instance = { schema: false, scope: [], scopable: false };
  this.server = Server;
  this.DS = null;
  this.router = require('./router')(Server);
};

Phobos.prototype.addController = function(controller) {
  this.router.addController(controller);
};

Phobos.prototype.scopeCarrier = function(model, field) {
  this.instance.scopable = { model: model, field: field };
};

Phobos.prototype.addScopeManifest = function(manifest) {
  this.instance.scope = manifest;
};

Phobos.prototype.start = function(options) {
  var port = process.env.PORT || 9292;
  this.router.mount(this.DS, this.instance);

  Server.listen(port, function() {
    console.log('=> Phobos.js server running on port ' + port);
  });
};

Phobos.prototype.addSchema = function(schema) {
  if (typeof schema !== 'function') return false;
  this.instance.schema = schema;
  this.DS = require('../initializers/mongoose')(this.instance.schema);
  return this.DS;
};

Phobos.prototype.addMiddleware = Phobos.registerMiddleware;
Phobos.prototype.addErrorHandler = Phobos.addErrorHandler;
Phobos.prototype.verifyToken = BearerToken.decode;
Phobos.prototype.generateToken = BearerToken.generate;

module.exports = new Phobos();
