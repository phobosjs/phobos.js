'use strict';

var BearerToken = require('./bearer');
var Inflector = require('inflected');
var Mutation = require('./mutation');

var REST = {
  index: { endpoint: '/', method: 'get' },
  new: { endpoint: '/', method: 'post' },
  show: { endpoint: '/:id', method: 'get' },
  update: { endpoint: '/:id', method: 'patch' },
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

  Builder.mixInController = function(spec, action) {
    return function(req, res, next) {
      var resource = Inflector.singularize(Inflector.camelize(req.route.path.split('/')[1]));

      req.controller = {
        spec: spec,
        action: action,
        permissions: Instance.scope[resource],
        model: resource
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
      Builder.mixInController(spec, action),
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
      Builder.mixInController({ verb: verb, name: name }, action),
      BearerToken.serialize,
      Builder.findUser,
      Builder.catchScope,
      Builder.resourceQuery,
      Builder.runQuery,
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
    if (req.user) {
      // Here we check for `admin` and `client`
      for (var s = 0; s < req.user.scope.length; s++) {
        if (req.controller.action.scope.indexOf(req.user.scope[s]) > -1) {
          req.caughtScope = req.user[Instance.scopable.field];
          return next();
        }
      }

      // And let's check to see if our user owns the resource
      if (req.controller.action.scope.indexOf('owner') > -1 && !Array.isArray(req.resource)) {
        for (var s = 0; s < req.controller.permissions.owners.length; s++) {
          var ownerCandidateID = req.rawResources[req.controller.permissions.owners[s]].toString();
          if (ownerCandidateID === req.user._id.toString()) {
            req.caughtScope = 'owner';
            return next();
          }
        }
      }
    }

    // Check for the global wildcard scope being whitelisted
    if (req.controller.action.scope.indexOf('*') > -1) {
      req.caughtScope = '*';
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

    next();
  };

  Builder.runQuery = function(req, res, next) {
    var Model = DS[req.controller.model];
    req.rawResources = {};

    if (req.params.id) {
      Model.findById(req.params.id, function(err, result) {
        req.rawResources = result;
        next();
      });
    } else {
      var q = Model.find(req.searchParams).limit(req.query.limit || 20);

      q.exec(function(err, result) {
        req.rawResources = result;
        next();
      });
    }
  };

  Builder.filterAllowedFields = function(req, res, next) {
    var allowed = [ '_id' ];

    if (req.controller.permissions.read === true) {
      allowed = true;
    } else if (Array.isArray(req.controller.permissions.read)) {
      allowed = req.controller.permissions.read;
    } else if (req.controller.permissions.read[req.caughtScope] === true) {
      allowed = true;
    } else if (typeof req.controller.permissions.read[req.caughtScope] === 'object') {
      allowed = allowed.concat(req.controller.permissions.read[req.caughtScope]);
    } else {
      req.resource = [];
      return next();
    }

    if (Array.isArray(req.rawResources)) {
      req.resource = [];
      for (var i = 0; i < req.rawResources.length; i++) {
        req.resource.push(Builder.filterFromResource(req.rawResources[i], allowed));
      }
    } else {
      req.resource = Builder.filterFromResource(req.rawResources, allowed);
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

  return Builder;

};

module.exports = Routes;
