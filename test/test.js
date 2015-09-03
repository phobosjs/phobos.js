'use strict';

var expect = require('chai').expect;

var Phobos = require('../index');
var Instance = new Phobos();

describe('Phobos object instantiates its stack', function() {

  it('', function() {
    expect(Instance).to.have.property('_options');
  });

});

describe('User configuration and launch', function() {
  var Instance = new Phobos({
    bearerTokenSignature: 'q34of8gerfhgo438egrs'
  });

  it('#start()', function() {
    expect(Instance.start()).to.not.equal(false);
  });

});
