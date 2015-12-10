'use strict';

/*
  router.js

  The router is where the resources are actually created. Middleware stacks are
  initialized here and the controllers are broken out into routes.
*/

var MiddlewareLoader = require('./middleware-loader');
var RESTPattern = require('../config/rest-pattern');
var BaseMiddleware = require('../middleware/base');

function PhobosRouter(express, DS, Mutation) {
  this._middleware = {
    manifest: require('../config/middleware-manifest'),
    stack: [],
    loader: new MiddlewareLoader({ DS: DS })
  };

  this._DS = DS;
  this._controllers = [];
  this._express = express;
  this._defaultResponders = require('../responders/default')(DS);
};

PhobosRouter.prototype.addController = function(controller) {
  this._controllers.push(controller(this._DS));
};

PhobosRouter.prototype.addMiddleware = function(middleware) {
  this._middleware.stack.push(this._middleware.loader.load(middleware));
};

PhobosRouter.prototype.mount = function() {
  this.stackMiddleware();
  for (var i = 0; i < this._controllers.length; i++) this.resource(this._controllers[i]);
};

// Create a resource using a given controller
PhobosRouter.prototype.resource = function(controller) {
  for (var i = 0; i < controller._expose.length; i++) {
    var spec = {};

    if (typeof controller._expose[i] === 'string') {
      var action = controller[controller._expose[i]];

      if (!action) action = this._defaultResponders[controller._expose[i]];

      var method = RESTPattern[controller._expose[i]].method;
      var endpoint = '/' + controller._verb + RESTPattern[controller._expose[i]].endpoint;
      var isRest = true;

      spec.verb = controller._verb;
      spec.name = controller._expose[i];
    } else if (typeof controller._expose[i] === 'object') {
      var action = controller[controller._expose[i].name];
      var method = controller._expose[i].method;
      var endpoint = '/' + controller._verb + controller._expose[i].endpoint;
      var isRest = false;

      spec.verb = controller._verb;
      spec.name = controller._expose[i].name;
    }

    var stack = this._middleware.stack.slice(0);

    stack.push(action.responder);
    stack.unshift(BaseMiddleware(spec, action, isRest));
    stack.unshift(endpoint);

    this._express[method].apply(this._express, stack);
  }
};

// We need to import all the middleware files and arrange them into a nice usable array
PhobosRouter.prototype.stackMiddleware = function() {
  for (var i = 0; i < this._middleware.manifest.length; i++) {
    if (typeof this._middleware.manifest[i] === 'string') {
      try {
        var file = require('../middleware/' + this._middleware.manifest[i]);
        var middleware = this._middleware.loader.load(file);

        this._middleware.stack.push(middleware);
      } catch(e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          console.log('[WARNING]: Middleware ' + this._middleware.manifest[i] + ' not found.');
        } else {
          throw e;
        }
      }
    } else if (typeof this._middleware.manifest[i] === 'function') {
      this._middleware.stack.push(this._middleware.manifest[i]);
    }
  }
};

module.exports = PhobosRouter;
