'use strict';

var BearerToken = require('./bearer');

var REST = {
  index: { endpoint: '/', method: 'get' },
  new: { endpoint: '/', method: 'post' },
  show: { endpoint: '/:id', method: 'get' },
  update: { endpoint: '/:id', method: 'patch' },
  delete: { endpoint: '/:id', method: 'delete' }
};

var Routes = function(express) {
  var Builder = { express: express };
  var middleware = [];

  Builder.registerMiddleware = function(func) {
    middleware.push(func);
  };

  Builder.mixInController = function(spec, action) {
    return function(req, res, next) {
      req.controller = { spec: spec, action: action };
      next();
    };
  };

  Builder.runMiddlewares = function(req, res, next) {
    if (middleware.length < 1) return next();

    for (var i = 0; i < middleware.length; i++) {
      middleware[i](req, res, next);
    }
  };

  // Sets an individual route
  Builder.route = function(controller) {
    controller._expose.forEach(function(el, i, arr) {
      if (typeof el === 'object') Builder.customRoute(controller._verb, el, controller[el.name]);
      if (typeof el === 'string') Builder.restRoute(controller._verb, el, controller[el]);
    });
  };

  // Handles a non-RESTful controller method
  Builder.customRoute = function(verb, spec, action) {
    if (!spec || !action) return;

    var method = spec.method;
    var endpoint = '/' + verb;

    if (spec.endpoint !== '/') endpoint += '/' + spec.endpoint;

    express[method](
      endpoint,
      Builder.mixInController(spec, action),
      BearerToken.serialize,
      Builder.runMiddlewares,
      action.responder
    );
  };

  // Handles a RESTful controller method
  Builder.restRoute = function(verb, name, action) {
    if (!REST[name] || !action) return;

    var method = REST[name].method;
    var endpoint = '/' + verb;

    if (REST[name].endpoint !== '/') endpoint += REST[name].endpoint;

    express[method](
      endpoint,
      Builder.mixInController({ verb: verb, name: name }, action),
      BearerToken.serialize,
      Builder.runMiddlewares,
      action.responder
    );
  };

  return Builder;

};

module.exports = Routes;
