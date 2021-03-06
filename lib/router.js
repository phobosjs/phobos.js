'use strict';

/*
  router.js

  The router is where the resources are actually created. Middleware stacks are
  initialized here and the controllers are broken out into routes.
*/

const MiddlewareLoader = require('./middleware-loader');
const RESTPattern = require('../config/rest-pattern');
const baseMiddleware = require('../middleware/base');

class PhobosRouter {

  constructor(express, DS) {
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
  }

  addController(controller) {
    this._controllers.push(controller(this._DS));
  }

  addMiddleware(middleware) {
    this._middleware.stack.push(this._middleware.loader.load(middleware));
  }

  mount() {
    this.stackMiddleware();
    for (let controller of this._controllers) this.resource(controller);
  }

  // Create a resource using a given controller
  resource(controller) {
    for (let exposedMethod of controller._expose) {
      const spec = {};

      let action = null;
      let endpoint = null;
      let method = null;
      let isRest = false;
      let leanQuery = true;

      if (typeof exposedMethod === 'string') {
        action = controller[exposedMethod];

        if (!action) {
          action = this._defaultResponders[exposedMethod];
        } else if (action && action.scope && !action.responder) {
          action.responder = this._defaultResponders[exposedMethod].responder;
        }

        method = RESTPattern[exposedMethod].method;
        endpoint = `/${controller._mountedAt}${RESTPattern[exposedMethod].endpoint}`;
        isRest = true;

        if (typeof action.leanQuery !== 'undefined') leanQuery = action.leanQuery;

        spec.mountedAt = controller._mountedAt;
        spec.name = exposedMethod;
      } else if (typeof exposedMethod === 'object') {
        action = controller[exposedMethod.name];
        method = exposedMethod.method;
        endpoint = `/${controller._mountedAt}/${exposedMethod.endpoint}`;
        isRest = false;

        spec.mountedAt = controller._mountedAt;
        spec.name = exposedMethod.name;
      }

      spec.leanQuery = leanQuery;

      const requestedStack = isRest ? 'restful' : 'adhoc';
      const stack = this._middleware.stacks[requestedStack].slice(0);

      if (typeof action.suppress !== 'undefined') {
        for (let s of action.suppress) {
          let index = this._middleware.manifest[requestedStack].indexOf(s);
          if (index > -1) stack.splice(index, 1);
        }
      }

      if (typeof action.withMiddleware === 'function') stack.push(action.withMiddleware);

      if (Array.isArray(action.withMiddleware)) {
        for (const mw of action.withMiddleware) {
          if (typeof mw === 'function') stack.push(mw);
        }
      }

      stack.push(action.responder);
      stack.unshift(baseMiddleware(spec, action, isRest));
      stack.unshift(endpoint);

      this._express[method].apply(this._express, stack);
    }
  }

  // We need to import all the middleware files and arrange them into a nice usable array
  stackMiddleware() {
    const manifest = this._middleware.manifest;
    const stacks = Object.keys(manifest);
    const uniques = [];

    for (let s of stacks) {
      for (let m of manifest[s]) {
        if (uniques.indexOf(m) === -1) uniques.push(m);
      }
    }

    this.loadMiddlewareStack(uniques);

    for (let s in manifest) {
      this._middleware.stacks[s] = [];

      for (let l in manifest[s]) {
        this._middleware.stacks[s].push(this._middleware.loaded[manifest[s][l]]);
      }
    }
  }

  loadMiddlewareStack(uniques) {
    for (let unique of uniques) {
      if (typeof unique === 'string') {
        try {
          const file = require(`../middleware/${unique}`);
          const middleware = this._middleware.loader.load(file);

          this._middleware.loaded[unique] = middleware;
        } catch (e) {
          if (e.code === 'MODULE_NOT_FOUND') {
            console.log(`[WARNING]: Middleware ${unique} not found.`);
          } else {
            throw e;
          }
        }
      }
    }
  }

}

module.exports = PhobosRouter;
