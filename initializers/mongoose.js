'use strict';

var mongoose = require('mongoose');
var inflect = require('inflected');

var Adapter = function(instanceSchema) {
  var gracefulExit = function() {
    mongoose.connection.close(function() {
      console.log('Mongoose default connection with DB is disconnected through app termination');
      process.exit(0);
    });
  }

  var options = { server: {}, replset: {} };
  options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 };

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

  // If the connection throws an error
  mongoose.connection.on('error', function(err) {
    console.error('Failed to connect to DB', err);
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', function () {
    console.log('Mongoose connection to DB disconnected');
  });

  mongoose.connect((process.env.MONGO_URI || 'mongodb://localhost/phobos'), options);

  var Adapter = {};
  var Schemas = (typeof instanceSchema === 'function') ? instanceSchema(mongoose) : {};

  for (var s in Schemas) {
    if (Schemas.hasOwnProperty(s)) Adapter[s] = mongoose.model(s, Schemas[s]);
  }

  return Adapter;
};

module.exports = Adapter;
