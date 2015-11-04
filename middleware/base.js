'use strict';

/*
  base.js

  The middleware stack relies on per-request variables to figure out what to do.
  This module is therefore run first, and sets some of these depending on what
  has been requested.
*/

var Inflector = require('inflected');

module.exports = function baseMiddleware(spec, action, rest) {
  return function(req, res, next) {
    var resource = Inflector.singularize(Inflector.camelize(req.route.path.split('/')[1]));

    req.controller = {
      spec: spec,
      action: action.responder,
      permissions: req.phobos.permissions[resource],
      model: resource,
      scopes: action.scope,
      _rest: rest
    };

    return next();
  }
};
