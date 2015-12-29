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
    loaded: {},
    stacks: {},
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

      if (!action) {
        action = this._defaultResponders[controller._expose[i]];
      } else if (action && action.scope && !action.responder) {
        action.responder = this._defaultResponders[controller._expose[i]].responder;
      };

      var method = RESTPattern[controller._expose[i]].method;
      var endpoint = '/' + controller._verb + RESTPattern[controller._expose[i]].endpoint;
      var isRest = true;

      spec.verb = controller._verb;
      spec.name = controller._expose[i];
    } else if (typeof controller._expose[i] === 'object') {
      var action = controller[controller._expose[i].name];
      var method = controller._expose[i].method;
      var endpoint = '/' + controller._verb + '/' + controller._expose[i].endpoint;
      var isRest = false;

      spec.verb = controller._verb;
      spec.name = controller._expose[i].name;
    }

    var requestedStack = isRest ? 'restful' : 'adhoc';
    var stack = this._middleware.stacks[requestedStack].slice(0);

    if (typeof action.suppress !== 'undefined') {
      for (var s = 0; s < action.suppress.length; s++) {
        var index = this._middleware.manifest[requestedStack].indexOf(action.suppress[s]);
        if (index > -1) stack.splice(index, 1);
      }
    }

    stack.push(action.responder);
    stack.unshift(BaseMiddleware(spec, action, isRest));
    stack.unshift(endpoint);

    this._express[method].apply(this._express, stack);
  }
};

// We need to import all the middleware files and arrange them into a nice usable array
PhobosRouter.prototype.stackMiddleware = function() {
  var manifest = this._middleware.manifest;
  var stacks = Object.keys(manifest);
  var uniques = [];

  for (var i = 0; i < stacks.length; i++) {
    for (var n = 0; n < manifest[stacks[i]].length; n++) {
      if (uniques.indexOf(manifest[stacks[i]][n]) === -1) uniques.push(manifest[stacks[i]][n]);
    }
  }

  this.loadMiddlewareStack(uniques);

  for (var s in manifest) {
    this._middleware.stacks[s] = [];

    for (var i = 0; i < manifest[s].length; i++) {
      this._middleware.stacks[s].push(this._middleware.loaded[manifest[s][i]]);
    }
  }
};

// We need to import all the middleware files and arrange them into a nice usable array
PhobosRouter.prototype.loadMiddlewareStack = function(uniques) {
  for (var i = 0; i < uniques.length; i++) {
    if (typeof uniques[i] === 'string') {
      try {
        var file = require('../middleware/' + uniques[i]);
        var middleware = this._middleware.loader.load(file);

        this._middleware.loaded[uniques[i]] = middleware;
      } catch(e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          console.log('[WARNING]: Middleware ' + uniques[i] + ' not found.');
        } else {
          throw e;
        }
      }
    }
  }
};

module.exports = PhobosRouter;
