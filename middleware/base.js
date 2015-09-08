'use strict';

var Inflector = require('inflected');

module.exports = function baseMiddleware(spec, action, rest) {
  return function(req, res, next) {
    var resource = Inflector.singularize(Inflector.camelize(req.route.path.split('/')[1]));

    req.controller = {
      spec: spec,
      action: action,
      permissions: req.phobos.permissions[resource],
      model: resource,
      _rest: rest
    };

    return next();
  }
};
