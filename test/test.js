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

});

describe('[MIDDLEWARE]', function() {
  var next = function(req, res, next) {};

  describe('Bearer token', function() {
    var middleware = require('../middleware/bearer');

    it('Properly decodes a req.query.auth_token or req.body.auth_token payload', function() {
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
      //middleware(request, response, next);
      //expect();
    });
  });

});

describe('Launch', function() {

  it('#start()', function() {
    expect(Instance.start()).to.not.equal(false);
  });

});
