'use strict';

var expect = require('chai').expect;
var httpMocks = require('node-mocks-http');
var mockgoose = require('mockgoose');

var Phobos = require('../index');
var Instance = new Phobos();

var Bearer = new (require('../lib/bearer'))('phobos__test');
var MiddlewareLoader = require('../lib/middleware-loader');

Instance.database = require('mongoose');
mockgoose(Instance.database);
Instance.addSchema(require('./support/sample_schema'));
var DS = Instance.initDb();

describe('[BASE]', function() {

  it('initializes the Phobos instance object properly', function() {
    expect(Instance).to.have.property('_options');
  });

  it('accepts options object to override defaults', function() {
    Instance.set('bearerTokenSignature', 'phobos__test');
    expect(Instance._options.bearerTokenSignature).to.equal('phobos__test');
  });

});

describe('[LIBRARIES]', function() {

  describe('Bearer Token', function() {
    it('generates and validates a given bearer token', function() {
      var token = Bearer.generate('__token__');
      expect(Bearer.verify(token)).to.equal('__token__');
    });

  });

  describe('Middleware Loader', function() {
    var instance = new MiddlewareLoader();

    it('Loads a plain middleware function', function() {
      var func = function(req, res, next) {
        return 'sample function';
      };

      expect(instance.load(func)()).to.equal('sample function');
    });

    it('Loads a middleware loader object with dependencies', function() {
      instance.dependencies['SampleRequirement'] = 'this sample requirement works';
      var obj = {
        inject: [ 'SampleRequirement' ],
        middleware: function(injection) {
          return function(req, res, next) {
            return injection;
          }
        }
      };

      expect(instance.load(obj)()).to.equal('this sample requirement works');
    });
  });

});

describe('[MIDDLEWARE]', function() {
  var Middleware = new MiddlewareLoader();

  describe('Base', function() {
    var middleware = Middleware.load(require('../middleware/base'));

    it('Sets per-request variables properly for a RESTful route', function() {
      var mounted = middleware({ verb: 'users', name: 'index' }, function() {}, true);

      var request = httpMocks.createRequest({
        route: {
          path: '/users'
        },
        phobos: {
          permissions: {
            User: {
              '*': true
            }
          }
        }
      });

      var response = httpMocks.createResponse();

      mounted(request, response, function(req, res, next) {
        expect(request.controller._rest).to.be.true;
        expect(request.controller.spec).to.have.property('verb');
        expect(request.controller.spec).to.have.property('name');
        expect(request.controller.action).to.be.a.function;
        expect(request.controller.permissions).to.have.property('*');
        expect(request.controller.model).to.equal('User');
      });
    });

    it('Sets per-request variables properly for a non-RESTful route', function() {

    });

  });

  describe('Bearer token', function() {
    var middleware = require('../middleware/bearer');

    it('Properly decodes a provided bearer token to payload', function() {
      var request = httpMocks.createRequest({
        query: {
          auth_token: Bearer.generate('__test_user')
        },
        phobos: {
          options: {
            bearerTokenSignature: 'phobos__test'
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(req, res, next) {
        expect(request.bearerToken).to.equal('__test_user');
      });
    });

    it('In case of no token, automatically demote user to ALL (*) scope', function() {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            bearerTokenSignature: 'phobos__test'
          }
        },
        controller: {
          action: {
            scope: [ '*' ]
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(req, res, next) {
        expect(request.bearerToken).to.be.undefined;
      });
    });

  });

  describe('Identify user given bearer token', function() {
    Middleware.dependencies = { DS: DS };
    var middleware = Middleware.load(require('../middleware/user'));
    var user_id;

    beforeEach(function(done) {
      mockgoose.reset();

      DS.User.create({
        username: 'testie',
        scope: [ 'user' ],
        password: 'hello_world123'
      }, function(err, user) {
        user_id = user._id;
        return done();
      });
    });

    it('and got to next() when there is no token', function() {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            scopeCarrier: { model: 'User' }
          }
        },
        controller: {
          action: {
            scope: [ '*' ]
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(req, res, next) {
        expect(request.user).to.be.undefined;
      });
    });

    it('and set req.user in case of a valid token', function() {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            scopeCarrier: { model: 'User' }
          }
        },
        controller: {
          action: {
            scope: [ '*' ]
          }
        },
        bearerToken: {
          user: user_id
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(req, res, next) {
        expect(request.user.username).to.equal('testie');
      });
    });

  });

  describe('Resource query', function() {
    Middleware.dependencies = { DS: DS };
    var middleware = Middleware.load(require('../middleware/query'));

  });

});

describe('[USER INTERFACE]', function() {

  it('#start()', function() {
    expect(Instance.start()).to.not.equal(false);
  });

});
