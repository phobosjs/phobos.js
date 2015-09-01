'use strict';

var expect = require('chai').expect;

var Phobos = require('../index');
var DS = Phobos.addSchema(require('./support/sample_schema'));
Phobos.scopeCarrier('User', 'scope');
Phobos.addScopeManifest(require('./support/sample_scope'));
Phobos.addController(require('./support/sample_controller'));

describe('Schemas', function() {

  it('#addSchema properly creates Mongoose models', function() {
    expect(DS).to.have.property('User');
    expect(DS).to.have.property('Task');
  });

});

describe('Controllers', function() {

  it('#addSchema properly creates Mongoose models', function() {
    expect(DS).to.have.property('User');
    expect(DS).to.have.property('Task');
  });

});
