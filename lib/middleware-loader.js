'use strict';

class MiddlewareLoader {

  constructor(dependencies) {
    this.dependencies = {};

    if (typeof dependencies === 'object') {
      for (let p in dependencies) {
        this.dependencies[p] = dependencies[p];
      }
    }

    return this;
  }

  invalid(req, res, next) {
    console.warn('=> Attempting to load invalid middleware');
    return next();
  }

  load(mw) {
    if (typeof mw === 'function') return mw;

    if (mw.inject && mw.middleware) {
       const injections = [];

      for (let i of mw.inject) {
        if (this.dependencies[i]) {
          injections.push(this.dependencies[i]);
        } else {
          console.warn(`=> Requested injectable ${i} not found`);
        }
      }

      return mw.middleware.apply(mw.middleware, injections);
    }

    return this.invalid;
  }

}

module.exports = MiddlewareLoader;
