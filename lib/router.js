'use strict';

var BearerToken = require('./bearer');
var Inflector = require('inflected');
var Mutation = require('./mutation');

var REST = {
  index: { endpoint: '/', method: 'get' },
  new: { endpoint: '/', method: 'post' },
  show: { endpoint: '/:id', method: 'get' },
  update: { endpoint: '/:id', method: 'put' },
  delete: { endpoint: '/:id', method: 'delete' }
};

var Routes = function(express, DS) {
  var Builder = { express: express };
  var middleware = [];
  var controllers = [];
  var DS = {};
  var Scopes = {};
  var Instance = {};

  Builder.mount = function(models, instanceObj) {
    DS = models;
    Instance = instanceObj;

    for (var i = 0; i < controllers.length; i++) {
      Builder.route(controllers[i](DS, Mutation(DS, Instance)));
    }
  };

  Builder.addController = function(controller) {
    controllers.push(controller);
  };

  Builder.registerMiddleware = function(func) {
    middleware.push(func);
  };

  Builder.mixInController = function(spec, action, rest) {
    return function(req, res, next) {
      var resource = Inflector.singularize(Inflector.camelize(req.route.path.split('/')[1]));

      req.controller = {
        spec: spec,
        action: action,
        permissions: Instance.scope[resource],
        model: resource,
        _rest: rest
      };

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
      Builder.mixInController(spec, action, false),
      BearerToken.serialize,
      Builder.findUser,
      Builder.catchScope,
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
      Builder.mixInController({ verb: verb, name: name }, action, true),
      BearerToken.serialize,
      Builder.findUser,
      Builder.resourceQuery,
      Builder.runQuery,
      Builder.catchScope,
      Builder.filterAllowedFields,
      Builder.runMiddlewares,
      action.responder
    );
  };

  Builder.findUser = function(req, res, next) {
    if (!req.bearerToken) return next();

    var User = DS[Instance.scopable.model];
    var query = User.findOne({ _id: req.bearerToken.user });

    query.lean().exec(function(err, user) {
      if (err) return res.status(500).send({ error: err });

      req.user = user;
      return next();
    });
  };

  Builder.catchScope = function(req, res, next) {
    var ownership = false;
    var permissions = req.controller.permissions.read;

    req.caughtScope = '*';

    if (req.user) {
      var userScopes = req.user[Instance.scopable.field];
      if (req.controller._rest) ownership = Builder._checkForOwnership(req);
      req.caughtScope = (ownership) ? 'owner' : Builder._highestScope(permissions, userScopes);
    }

    if (permissions === true || permissions[req.caughtScope] === true) {
      req.allowedFields = true;
      return next();
    } else if (Array.isArray(permissions)) {
      req.allowedFields = permissions;
      return next();
    } else if (Array.isArray(permissions[req.caughtScope])) {
      req.allowedFields = permissions[req.caughtScope];
      return next();
    }

    // The user is not authorized to see this resource
    return res.status(401).send({ error: 'Insufficient permission for that' });
  };

  Builder.resourceQuery = function(req, res, next) {
    req.searchParams = {};

    if (!req.params.id && req.controller.permissions.searchableBy) {
      var allowed = req.controller.permissions.searchableBy;

      for (var i = 0; i < allowed.length; i++) {
        if (req.query[allowed[i]]) req.searchParams[allowed[i]] = req.query[allowed[i]];
      }
    }

    return next();
  };

  Builder.runQuery = function(req, res, next) {
    var Model = DS[req.controller.model];
    req.rawResources = {};

    if (req.params.id) {
      var q = Model.findById(req.params.id);

      q.exec(function(err, result) {
        req.rawResources = result;
        return next();
      });
    } else if (!req.params.id && req.method === 'GET') {
      var q = Model.find(req.searchParams).limit(req.query.limit || 20);

      q.lean().exec(function(err, result) {
        req.rawResources = result;
        return next();
      });
    } else {
      return next();
    }
  };

  Builder.filterAllowedFields = function(req, res, next) {
    if (req.allowedFields !== true) req.allowedFields.push('_id');

    if (Array.isArray(req.rawResources)) {
      req.resource = [];
      for (var i = 0; i < req.rawResources.length; i++) {
        req.resource.push(Builder.filterFromResource(req.rawResources[i], req.allowedFields));
      }
    } else {
      req.resource = Builder.filterFromResource(req.rawResources, req.allowedFields);
    }

    next();
  };

  Builder.filterFromResource = function(resource, allowed) {
    if (allowed === true) return resource;
    var safeResource = {};

    for (var i = 0; i < allowed.length; i++) {
      safeResource[allowed[i]] = resource[allowed[i]];
    }

    return safeResource;
  };

  Builder._checkForOwnership = function(req) {
    var model = req.controller.model;
    var permissions = req.controller.permissions;

    if (!permissions.owners || permissions.owners.length < 1) return false;
    if (Array.isArray(req.rawResources)) return false;
    if (!req.user) return false;

    for (var i = 0; i < permissions.owners.length; i++) {
      if (req.rawResources[permissions.owners[i]].toString() === req.user._id.toString()) return true;
    }

    return false;
  };

  Builder._highestScope = function(permissions, scopes) {
    if (typeof permissions === 'undefined') return '*';

    var highest = 0;
    var fieldCount = 0;

    scopes.unshift('*');

    for (var i = 0; i < scopes.length; i++) {
      if (permissions === true || Array.isArray(permissions)) {
        return '*';
      } else if (permissions[scopes[i]] === true) {
        return scopes[i];
      } else if (Array.isArray(permissions[scopes[i]]) && (fieldCount < permissions[scopes[i]].length)) {
        highest = i;
        fieldCount = permissions[scopes[i]].length;
      }
    }

    return scopes[highest];
  };

  return Builder;

};

module.exports = Routes;
