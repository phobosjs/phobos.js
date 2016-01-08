'use strict';

var chai = require('chai');

chai.use(require('chai-as-promised'));

var expect = chai.expect;
var httpMocks = require('node-mocks-http');
var Phobos = require('../index');
var Instance = new Phobos();
var Router = require('../lib/router');

var Bearer = new (require('../lib/bearer'))('phobos__test');
var MiddlewareLoader = require('../lib/middleware-loader');

Instance.addSchema(require('./support/sample_schema'));

var DS = Instance.initDb();

var connection = Instance.database.connection;

before(function(done) {
  connection.on('open', function() {
    connection.db.dropDatabase();
    done();
  });
});

after(function(done) {
  connection.close(done);
});

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
    var instance;

    beforeEach(function(done) {
      instance = new MiddlewareLoader({ test: 'foobar' });
      done();
    });

    afterEach(function(done) {
      instance = undefined;
      done();
    });

    it('loads a plain middleware function', function() {
      var func = function(err) {
        return 'sample function';
      };

      expect(instance.load(func)()).to.equal('sample function');
    });

    it('Loads a middleware loader object with dependencies', function() {
      instance.dependencies['SampleRequirement'] = 'this sample requirement works';
      var obj = {
        inject: [ 'SampleRequirement' ],
        middleware: function(injection) {
          return function(err) {
            return injection;
          }
        }
      };

      expect(instance.load(obj)()).to.equal('this sample requirement works');
    });
  });

  describe('Router', function() {
    var instance = new Router(Instance.server, DS);

    it('Creates a RESTful resource out of a controller', function() {
      instance.addController(require('./support/sample_controller'));
      instance.mount();

      expect(instance._express._router.stack).to.be.instanceOf(Array);

      expect(instance._express._router.stack[2].route.path).to.equal('/users/');
      expect(instance._express._router.stack[2].route.methods).to.have.property('get');

      expect(instance._express._router.stack[3].route.path).to.equal('/users/:id');
      expect(instance._express._router.stack[3].route.methods).to.have.property('get');

      expect(instance._express._router.stack[4].route.path).to.equal('/users/');
      expect(instance._express._router.stack[4].route.methods).to.have.property('post');

      expect(instance._express._router.stack[5].route.path).to.equal('/users/:id');
      expect(instance._express._router.stack[5].route.methods).to.have.property('put');

      expect(instance._express._router.stack[6].route.path).to.equal('/users/:id');
      expect(instance._express._router.stack[6].route.methods).to.have.property('delete');
    });
  });

});

describe('[MIDDLEWARE]', function() {
  var Middleware = new MiddlewareLoader({ DS: DS });
  var user_id;

  beforeEach(function(done) {
    DS.User.remove({}, function() {
      DS.User.create({
        username: 'testie_mcfly',
        scope: [ 'user' ],
        password: 'hello_world123'
      }, function(err, user) {
        user_id = user._id;
        return done();
      });
    });
  });

  describe('Base', function() {
    var middleware = Middleware.load(require('../middleware/base'));

    it('sets per-request variables properly for a RESTful route', function() {
      var mounted = middleware({
        verb: 'users',
        name: 'index'
      }, {
        scope: [ '*' ],
        responder: function() {}
      }, true);

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

      mounted(request, response, function(err) {
        expect(request.controller._rest).to.be.true;
        expect(request.controller.spec).to.have.property('verb');
        expect(request.controller.spec).to.have.property('name');
        expect(request.controller.action).to.be.a.function;
        expect(request.controller.permissions).to.have.property('*');
        expect(request.controller.model).to.equal('User');
      });
    });

    it('sets per-request variables properly for a non-RESTful route', function() {
      var mounted = middleware({
        name: 'sample',
        method: 'get',
        endpoint: 'sample'
      }, {
        scope: [ '*' ],
        responder: function() {}
      }, false);

      var request = httpMocks.createRequest({
        route: {
          path: '/users/sample'
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

      mounted(request, response, function(err) {
        expect(err).to.be.undefined;
        expect(request.controller._rest).to.be.false;
        expect(request.controller.spec).to.have.property('method');
        expect(request.controller.spec).to.have.property('endpoint');
        expect(request.controller.spec).to.have.property('name');
        expect(request.controller.action).to.be.a.function;
        expect(request.controller.permissions).to.have.property('*');
        expect(request.controller.model).to.equal('User');
      });
    });

  });

  describe('Bearer token', function() {
    var middleware = require('../middleware/bearer');

    it('properly decodes a provided bearer token to payload', function() {
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

      middleware(request, response, function(err) {
        expect(err).to.be.undefined;
        expect(request.bearerToken).to.equal('__test_user');
      });
    });

    it('in case of no token, automatically demote user to ALL (*) scope', function() {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            bearerTokenSignature: 'phobos__test'
          }
        },
        controller: {
          scopes: [ '*' ]
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(err).to.be.undefined;
        expect(request.bearerToken).to.be.undefined;
      });
    });

  });

  describe('Identification of user', function() {
    var middleware = Middleware.load(require('../middleware/user'));

    it('and got to next() when there is no token', function() {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            scopeCarrier: { model: 'User' }
          }
        },
        controller: {
          scopes: [ '*' ]
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(err).to.be.undefined;
        expect(request.user).to.be.undefined;
      });
    });

    it('and set req.user in case of a valid token', function(done) {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            scopeCarrier: { model: 'User' }
          }
        },
        controller: {
          scopes: [ '*' ]
        },
        bearerToken: user_id
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(err).to.be.undefined;
        expect(request.user.username).to.equal('testie_mcfly');
        done();
      });
    });

  });

  describe('Resource query', function() {
    var middleware = Middleware.load(require('../middleware/query-parser'));

    it('adds only whitelisted search params to the query object', function() {
      var request = httpMocks.createRequest({
        controller: {
          permissions: {
            searchableBy: [ 'username' ]
          }
        },
        parsedQuery: {
          username: 'test',
          password: 'top secret'
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(err).to.be.undefined;
        expect(request.searchParams).to.not.have.property('password');
        expect(request.searchParams).to.have.property('username');
      });
    });

  });

  describe('Includable parser', function() {
    var middleware = Middleware.load(require('../middleware/includables'));

    var request = httpMocks.createRequest({
      controller: {
        model: 'Task'
      },
      query: {
        include: 'owner'
      }
    });

    var response = httpMocks.createResponse();

    it('detects includable objects', function() {
      middleware(request, response, function() {
        expect(request).to.have.property('includeRelations');
        expect(request.includeRelations).to.be.an('object');
        expect(request.includeRelations).ownProperty('owner');
        expect(request.includeRelations.owner.model).to.equal('User');
        expect(request.includeRelations.owner.field).to.equal('owner');
      });
    });

  });

  describe('Query runner', function() {
    var middleware = Middleware.load(require('../middleware/query-runner'));

    it('runs a findOne query when an ID is given in the route', function(done) {
      var request = httpMocks.createRequest({
        controller: {
          model: 'User'
        },
        params: {
          id: user_id
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(request).to.have.property('rawResources');
        expect(request.rawResources.username).to.equal('testie_mcfly');
        done();
      });
    });

    it('runs a find query when no ID when on index', function(done) {
      var request = httpMocks.createRequest({
        controller: {
          model: 'User'
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(request).to.have.property('rawResources');
        expect(request).to.have.property('rawResourcesCount');
        expect(request.rawResources).to.be.instanceOf(Array);
        expect(request.rawResourcesCount).to.equal(1);
        expect(request.rawResources[0].username).to.equal('testie_mcfly');
        done();
      });
    });

    it('searches query params on index and finds result', function(done) {
      var request = httpMocks.createRequest({
        controller: {
          model: 'User'
        },
        searchParams: {
          username: 'testie_mcfly'
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(request).to.have.property('rawResources');
        expect(request).to.have.property('rawResourcesCount');
        expect(request.rawResources).to.be.instanceOf(Array);
        expect(request.rawResourcesCount).to.equal(1);
        done();
      });
    });

    it('searches query params on index and finds 0 when no match', function(done) {
      var request = httpMocks.createRequest({
        controller: {
          model: 'User'
        },
        searchParams: {
          username: 'testie_poop'
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(request).to.have.property('rawResources');
        expect(request).to.have.property('rawResourcesCount');
        expect(request.rawResources).to.be.instanceOf(Array);
        expect(request.rawResourcesCount).to.equal(0);
        done();
      });
    });

  });

  describe('Scope catch', function() {
    var middleware = Middleware.load(require('../middleware/scope-catch'));

    it('gives the `*` scope to a non-authenticated user', function() {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            availableScopes: [ '*', 'user', 'owner', 'admin' ]
          }
        },
        rawResources: {
          _id: '12121212',
          user: 'test_owner_user'
        },
        controller: {
          scopes: [ '*', 'user' ]
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('caughtScope');
        expect(request.caughtScope).to.be.instanceOf(Array);
        expect(request.caughtScope).to.contain('*');
        expect(request.caughtScope).to.not.contain('user');
      });
    });

    it('detects `user` scope', function() {
      var request = httpMocks.createRequest({
        user: {
          _id: 'test_owner_user',
          scope: [ 'user' ]
        },
        phobos: {
          options: {
            scopeCarrier: {
              availableScopes: [ '*', 'user', 'owner', 'admin' ]
            }
          }
        },
        rawResources: {
          _id: '12121212',
          user: 'test_owner_user'
        },
        controller: {
          scopes: [ 'user', 'owner' ]
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('caughtScope');
        expect(request.caughtScope).to.be.instanceOf(Array);
        expect(request.caughtScope).to.contain('user');
      });
    });

  });

  describe('Ownership', function() {
    var middleware = Middleware.load(require('../middleware/ownership'));

    it('correctly grants ownership', function() {
      var response = httpMocks.createResponse();

      var request = httpMocks.createRequest({
        rawResources: {
          _id: '12121212',
          owner: 'test_owner_user'
        },
        user: {
          _id: 'test_owner_user'
        },
        controller: {
          permissions: {
            owners: [ 'owner' ]
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('ownership');
        expect(request.ownership).to.be.true;
      });
    });

    it('correctly denies ownership', function() {
      var response = httpMocks.createResponse();

      var request = httpMocks.createRequest({
        rawResources: {
          _id: '12121212',
          owner: 'not_test_owner_user'
        },
        user: {
          _id: 'test_owner_user'
        },
        controller: {
          permissions: {
            owners: [ 'owner' ]
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('ownership');
        expect(request.ownership).to.not.be.true;
      });
    });
  });

  describe('Apply scope', function() {
    var middleware = Middleware.load(require('../middleware/apply-scope'));

    it('non-elevated users always get `*`', function() {
      var request = httpMocks.createRequest({
        caughtScope: [ '*' ],
        method: 'GET',
        user: {}
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('appliedScope');
        expect(request.appliedScope).to.equal('*');
      });
    });

    it('owners get ownership elevated scope applied', function() {
      var request = httpMocks.createRequest({
        caughtScope: [ '*' ],
        method: 'GET',
        user: {},
        ownership: true,
        controller: {
          scopes: [ '*', 'owner' ],
          _rest: true,
          permissions: {
            read: true
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('appliedScope');
        expect(request.appliedScope).to.equal('owner');
      });
    });

    it('a user with elevated caught scope will have that applied', function() {
      var request = httpMocks.createRequest({
        caughtScope: [ '*', 'admin' ],
        method: 'GET',
        user: {},
        ownership: false,
        controller: {
          scopes: [ '*', 'owner', 'admin' ],
          _rest: true,
          permissions: {
            read: true
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('appliedScope');
        expect(request.appliedScope).to.equal('admin');
      });
    });

    it('a non-resourceful route gets the topmost scope from the user', function() {
      var request = httpMocks.createRequest({
        caughtScope: [ '*', 'admin' ],
        method: 'GET',
        user: {},
        controller: {
          scopes: [ '*', 'owner', 'admin' ],
          _rest: false,
          permissions: {
            read: true
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('appliedScope');
        expect(request.appliedScope).to.equal('admin');
      });
    });
  });

  describe('Mutation', function() {
    var middleware = Middleware.load(require('../middleware/mutate'));
    var resource;

    beforeEach(function(done) {
      DS.User.remove({}, function() {
        DS.User.create({
          username: 'testie_mcfly',
          scope: [ 'user' ],
          password: 'hello_world123'
        }, function(err, user) {
          resource = user;
          return done();
        });
      });
    });

    it('ignores reads', function() {
      var request = httpMocks.createRequest({
        appliedScope: [ '*' ],
        method: 'GET',
        user: {},
        ownership: false,
        controller: {
          scopes: [ 'owner' ],
          _rest: true,
          permissions: {
            edit: { '*': false }
          }
        },
        path: '/users/' + resource._id
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(err).to.be.undefined;
        expect(request.mutated).to.equal(false);
      });
    });

    it('denies a write when there is insufficient permissions', function() {
      var request = httpMocks.createRequest({
        appliedScope: [ '*' ],
        method: 'PUT',
        user: {},
        ownership: false,
        controller: {
          scopes: [ 'owner' ],
          _rest: true,
          permissions: {
            edit: { '*': false }
          }
        },
        path: '/users/' + resource._id,
        rawResources: resource,
        body: {
          user: {}
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(err).to.be.defined;
        expect(err.translation).to.equal('api.error.auth.insufficient_privilege');
      });
    });

    it('creates a resource', function(done) {
      var request = httpMocks.createRequest({
        appliedScope: [ '*' ],
        method: 'POST',
        user: {},
        controller: {
          scopes: [ '*' ],
          _rest: true,
          permissions: {
            create: true
          },
          model: 'User'
        },
        path: '/users',
        body: {
          user: {
            username: 'new_user_mcfly',
            password: 'hello_world123'
          }
        },
        rawResources: {}
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(request.mutated).to.be.true;
        expect(request.rawResources.username).to.equal('new_user_mcfly');

        done();
      });
    });

    it('updates a resource', function(done) {
      var request = httpMocks.createRequest({
        appliedScope: [ '*' ],
        method: 'PUT',
        user: {},
        controller: {
          scopes: [ '*' ],
          _rest: true,
          permissions: {
            edit: true
          },
          model: 'User'
        },
        path: '/users/' + resource._id,
        body: {
          user: {
            username: 'modified_user_mcfly'
          }
        },
        rawResources: resource
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        expect(request.mutated).to.be.true;
        expect(request.rawResources.username).to.equal('modified_user_mcfly');

        done();
      });
    });

    it('deletes a resource', function(done) {
      var _id = resource._id;

      var request = httpMocks.createRequest({
        appliedScope: [ '*' ],
        method: 'DELETE',
        user: {},
        controller: {
          scopes: [ '*' ],
          _rest: true,
          permissions: {
            delete: true
          },
          model: 'User'
        },
        path: '/users/' + resource._id,
        rawResources: resource
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function(err) {
        DS.User.findOne(_id, function(err, user) {
          expect(request.mutated).to.be.true;
          expect(user).to.be.null;

          done();
        });
      });
    });
  });

  describe('Allowed fields filtration', function() {
    var middleware = Middleware.load(require('../middleware/filter-fields'));

    it('handles show filtration based on scopes', function() {
      var request = httpMocks.createRequest({
        appliedScope: [ 'admin' ],
        method: 'GET',
        controller: {
          scopes: [ '*', 'owner', 'admin' ],
          _rest: true,
          permissions: {
            read: {
              'admin': [ 'show' ]
            }
          }
        },
        rawResources: {
          _id: '11111',
          show: true,
          dontShow: true
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('resource');
        expect(request.resource).to.have.property('show');
        expect(request.resource).to.have.property('_id');
        expect(request.resource).to.not.have.property('dontShow');
      });
    });

    it('handles index filtration based on scopes', function() {
      var request = httpMocks.createRequest({
        appliedScope: [ 'admin' ],
        method: 'GET',
        controller: {
          scopes: [ '*', 'owner', 'admin' ],
          _rest: true,
          permissions: {
            read: {
              'admin': [ 'show' ]
            }
          }
        },
        rawResources: [
          {
            _id: '11111',
            show: true,
            dontShow: true
          },
          {
            _id: '22222',
            show: true,
            dontShow: true
          }
        ]
      });

      var response = httpMocks.createResponse();

      middleware(request, response, function() {
        expect(request).to.have.property('resource');
        expect(request.resource).to.be.instanceOf(Array);
        expect(request.resource[0]).to.have.property('show');
        expect(request.resource[0]).to.have.property('_id');
        expect(request.resource[0]).to.not.have.property('dontShow');
      });
    });
  });

});

describe('[USER INTERFACE]', function() {

  it('#start()', function() {
    expect(Instance.start()).to.not.equal(false);
  });

});
