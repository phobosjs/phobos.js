'use strict';

var expect = require('chai').expect;
var httpMocks = require('node-mocks-http');

var Phobos = require('../index');
var Instance = new Phobos();

var Bearer = new (require('../lib/bearer'))('phobos__test');

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
    var MiddlewareLoader = new (require('../lib/middleware-loader'));

    it('Loads a plain middleware function', function() {
      var func = function(req, res, next) {
        return 'sample function';
      };

      expect(MiddlewareLoader.load(func)()).to.equal('sample function');
    });

    it('Loads a middleware loader object with dependencies', function() {
      MiddlewareLoader.dependencies['SampleRequirement'] = 'this sample requirement works';
      var obj = {
        inject: [ 'SampleRequirement' ],
        middleware: function(injection) {
          return function(req, res, next) {
            return injection;
          }
        }
      };

      expect(MiddlewareLoader.load(obj)()).to.equal('this sample requirement works');
    });
  });

});

describe('[MIDDLEWARE]', function() {
  var next = function(req, res, next) {};

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

      middleware(request, response, next);
      expect(request.bearerToken).to.equal('__test_user');
    });

    it('In case of no token, automatically demote user to ALL (*) scope', function() {
      var request = httpMocks.createRequest({
        phobos: {
          options: {
            bearerTokenSignature: 'phobos__test'
          },
          controller: {
            action: {
              scope: [ '*' ]
            }
          }
        }
      });

      var response = httpMocks.createResponse();

      middleware(request, response, next);
      expect(request.bearerToken).to.be.undefined;
    });
  });

});

describe('Launch', function() {

  it('#start()', function() {
    expect(Instance.start()).to.not.equal(false);
  });

});
