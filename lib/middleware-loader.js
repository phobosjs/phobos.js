'use strict';

function MiddlewareLoader(dependencies) {
  this.dependencies = {};

  if (typeof dependencies === 'object') {
    for (var p in dependencies) {
      this.dependencies[p] = dependencies[p];
    }
  }

  return this;
};

MiddlewareLoader.prototype.invalid = function(req, res, next) {
  console.warn('=> Attempting to load invalid middleware');
  return next();
};

MiddlewareLoader.prototype.load = function load(mw) {
  if (typeof mw === 'function') return mw;

  if (mw.inject && mw.middleware) {
    var injections = [];

    for (var i = 0; i < mw.inject.length; i++) {
      if (this.dependencies[mw.inject[i]]) {
        injections.push(this.dependencies[mw.inject[i]]);
      } else {
        console.warn('=> Requested injectable `' + mw.inject[i] + '` not found');
      }
    }

    return mw.middleware.apply(mw.middleware, injections);
  }

  return this.invalid;
};

module.exports = MiddlewareLoader;
