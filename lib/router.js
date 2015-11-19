'use strict';

/*
  router.js
  
  The router is where the resources are actually created. Middleware stacks are 
  initialized here and the controllers are broken out into routes.
*/

var MiddlewareLoader = require('./middleware-loader');
var RESTPattern = require('../config/rest-pattern');

function PhobosRouter(express) {
  this._middleware = require('../config/middleware-manifest');
  this._controllers = [];
  this._express = express;
};

PhobosRouter.prototype.addController = function(controller) {
  
};

PhobosRouter.prototype.addMiddleware = function(middleware) {
  
};

PhobosRouter.prototype.mount = function(controller) {
  
};

module.exports = PhobosRouter;
