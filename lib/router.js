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

var MethodMatrix = {
  GET: 'read',
  POST: 'create',
  PUT: 'edit',
  DELETE: 'delete'
};

var Routes = function(express, DS) {
  var Builder = { express: express };
  var middleware = [];
  var controllers = [];
  var DS = {};
  var Scopes = {};
  var Instance = {};
  var ErrorHandler = require('./errors');

  Builder.mount = function(models, instanceObj) {
    DS = models;
    Instance = instanceObj;

    for (var i = 0; i < controllers.length; i++) {
      Builder.route(controllers[i](DS, Mutation(DS, Instance)));
    }

    express.use(ErrorHandler);
  };

  Builder.addErrorHandler = function(func) {
    ErrorHandler = func;
  };

  Builder.addController = function(controller) {
    controllers.push(controller);
  };

  Builder.registerMiddleware = function(func) {
    middleware.push(func);
  };

  Builder.mixInController = function(spec, action, rest, params) {
    return function(req, res, next) {
      var route = Inflector.singularize(Inflector.camelize(req.route.path.split('/')[1]));
      var resource = params.parent ? params.parent.resource : route;
      var locator = params.parent ? params.parent.fieldName + '._id' : '_id';

      req.controller = {
        spec: spec,
        action: action,
        permissions: Instance.scope[route],
        route: route,
        model: resource,
        locator: locator,
        _rest: rest,
        child: route !== resource
      };

      if (params.parent) req.controller.fieldName = params.parent.fieldName;

      return next();
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
    var params = {};

    if (controller._parent) params.parent = controller._parent;

    controller._expose.forEach(function(el, i, arr) {
      if (typeof el === 'object') Builder.customRoute(controller._verb, el, controller[el.name], params);
      if (typeof el === 'string') Builder.restRoute(controller._verb, el, controller[el], params);
    });
  };

  // Handles a non-RESTful controller method
  Builder.customRoute = function(verb, spec, action, params) {
    if (!spec || !action) return;

    var method = spec.method;
    var endpoint = '/' + verb;

    if (spec.endpoint !== '/') endpoint += '/' + spec.endpoint;

    express[method](
      endpoint,
      Builder.mixInController(spec, action, false, params),
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

  // Handles a RESTful controller method
  Builder.restRoute = function(verb, name, action, params) {
    if (!REST[name] || !action) return;

    var method = REST[name].method;
    var endpoint = '/' + verb;

    if (REST[name].endpoint !== '/') endpoint += REST[name].endpoint;

    express[method](
      endpoint,
      Builder.mixInController({ verb: verb, name: name }, action, true, params),
      BearerToken.serialize,
      Builder.findUser,
      Builder.resourceQuery,
      Builder.processIncludables,
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
      if (err) return next(err);

      req.user = user;
      return next();
    });
  };

  Builder.catchScope = function(req, res, next) {
    var ownership = false;
    var permissions = req.controller.permissions[MethodMatrix[req.method]] || req.controller.permissions;

    req.caughtScope = '*';

    if (req.user) {
      var userScopes = req.user[Instance.scopable.field];
      if (['index', 'new'].indexOf(req.controller.spec.name) === -1) ownership = Builder._checkForOwnership(req);
      req.caughtScope = (ownership) ? 'owner' : Builder._highestScope(permissions, userScopes);
    }

    if (permissions === true || permissions[req.caughtScope] === true) {
      req.allowedFields = true;
      return next();
    } else if (Array.isArray(permissions)) {
      req.allowedFields = JSON.parse(JSON.stringify(permissions));
      return next();
    } else if (Array.isArray(permissions[req.caughtScope])) {
      req.allowedFields = JSON.parse(JSON.stringify(permissions[req.caughtScope]));
      return next();
    } else if (!req.controller._rest && ownership) {
      req.allowedFields = true;
      return next();
    }

    // The user is not authorized to see this resource
    return next({ stack: 'auth', translation: 'api.error.auth.insufficient_privilege', message: 'Insufficient privileges for that' });
  };

  Builder.resourceQuery = function(req, res, next) {
    req.searchParams = {};

    if (!req.params.id && req.controller.permissions.searchableBy) {
      var allowed = req.controller.permissions.searchableBy;

      for (var i = 0; i < allowed.length; i++) {
        if (req.parsedQuery[allowed[i]]) req.searchParams[allowed[i]] = req.parsedQuery[allowed[i]];
      }
    }

    return next();
  };

  Builder.processIncludables = function(req, res, next) {
    req.includeRelations = [];

    if (!req.query.include || req.query.include === '') return next();

    var relations = req.query.include.split(',');

    for (var i = 0; i < relations.length; i++) {
      req.includeRelations.push(relations[i]);
    }

    return next();
  };

  Builder.runQuery = function(req, res, next) {
    var Model = DS[req.controller.model];
    req.rawResources = {};

    if (req.params.id && !req.controller.child) {
      var q = Model.findById(req.params.id);

      q.lean().exec(function(err, result) {
        if (err) return next(err);

        req.rawResources = result;
        return next();
      });
    } else if (req.params.id && req.controller.child) {
      var search = {};
      search[req.controller.locator] = req.params.id;

      var q = Model.findOne(search);

      q.lean().exec(function(err, result) {
        if (err) return next(err);
        if (result === null) return next({ message: 'not found' });

        var resource = result[req.controller.fieldName];

        if (Array.isArray(resource)) {
          for (var i = 0; i < resource.length; i++) {
            if (req.params.id === resource[i]._id.toString()) resource = resource[i];
          }
        }

        req.rawResources = resource;
        return next();
      });

    } else if (!req.params.id && req.method === 'GET' && !req.controller.child) {
      var q = Model.find(req.searchParams);
      var count = Model.count(req.searchParams);

      if (req.query.page) {
        var perPage = parseInt(req.query.perPage) || 20;
        q.skip((parseInt(req.query.page) * perPage) - perPage);
        q.limit(perPage);
      } else {
        q.limit(req.query.limit || 20);
      }

      if (req.includeRelations) {
        for (var i = 0; i < req.includeRelations.length; i++) {
          q.populate(req.includeRelations[i]);
        }
      }

      if (req.query.sort) q.sort(req.query.sort);

      q.lean().exec(function(err, result) {
        if (err) return next(err);

        count.lean().exec(function(err, counter) {
          if (err) return next(err);

          req.rawResources = result;
          req.rawResourcesCount = counter;
          return next();
        });
      });
    } else if (!req.params.id && req.method === 'GET' && req.controller.child) {
      var projection = {};
      var fields = Object.keys(DS[req.controller.route].schema.paths);

      for (var i = 0; i < fields.length; i++) {
        projection[fields[i]] = '$' + req.controller.fieldName + '.' + fields[i];
      }

      var query = [
        { $match: req.searchParams },
        { $unwind: '$' + req.controller.fieldName },
        { $match: req.searchParams },
        { $project: projection }
      ];

      var agg = Model.aggregate(query);

      agg.exec(function(err, result) {
        if (err) return next(err);

        var resource = [];

        if (req.query.page) {
          var perPage = parseInt(req.query.perPage) || 20;
          var skip = (parseInt(req.query.page) * perPage) - perPage;
          resource = result.slice(skip, skip + perPage);
        } else {
          resource = result.slice(0, 19);
        }

        req.rawResources = resource;
        req.rawResourcesCount = result.length;
        return next();
      });
    } else {
      return next();
    }
  };

  Builder.filterAllowedFields = function(req, res, next) {
    req.resource = [];

    if (Object.keys(req.rawResources).length === 0) return next();
    if (req.allowedFields !== true) req.allowedFields.push('_id');

    if (Array.isArray(req.rawResources)) {
      for (var i = 0; i < req.rawResources.length; i++) {
        req.resource.push(Builder.filterFromResource(req.rawResources[i], req.allowedFields));
      }
    } else {
      req.resource = Builder.filterFromResource(req.rawResources, req.allowedFields);
    }

    return next();
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
    if (Object.keys(req.rawResources).length === 0) return false;

    var model = req.controller.model;
    var permissions = req.controller.permissions;

    if (!permissions.owners || permissions.owners.length < 1) return false;
    if (Array.isArray(req.rawResources)) return false;
    if (!req.user) return false;

    for (var i = 0; i < permissions.owners.length; i++) {
      if (typeof req.rawResources[permissions.owners[i]] === 'undefined') return false;
      if (typeof req.user._id === 'undefined') return false;

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
