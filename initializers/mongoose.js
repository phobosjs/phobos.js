'use strict';

var mongoose = require('mongoose');
var inflect = require('inflected');

var Adapter = function(instanceSchema) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/api');

  var Adapter = {};
  var Schemas = (typeof instanceSchema === 'function') ? instanceSchema(mongoose) : {};

  for (var s in Schemas) {
    if (Schemas.hasOwnProperty(s)) Adapter[s] = mongoose.model(s, Schemas[s]);
  }

  return Adapter;
};

module.exports = Adapter;
