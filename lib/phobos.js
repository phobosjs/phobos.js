'use strict';

var express = require('express');
var mongoose = require('mongoose');

function Phobos(options) {
  this._options = {
    port: 9292,
    appName: 'Phobos.js',
    bearerTokenSignature: null,
    dbUri: 'mongodb://localhost/phobos',
    scopeCarrier: { model: 'User', field: 'scope' }
  };

  for (var p in options) {
    if (this._options.hasOwnProperty(p)) this._options[p] = options[p];
  }

  // Initialize the Express.js server
  this.server = express();
  this.expressPlugins = require('../plugins/express');

  // Initialize our database helpers
  this.databasePlugins = {};
  this._databaseInitFlag = false;
  this.database = mongoose;

  // Initialize some building blocks for the app
  this.DS;
  this.controllers = [];
  this.scopes = {};

  return this;
};

// Manually set config options
Phobos.prototype.set = function set(option, value) {
  this._options[option] = value;
  return this;
};

// Adds a controller to the API
Phobos.prototype.addController = function addController(controller) {
  this.controllers.push(controller);
  return this;
};

// Sets up the permission matrix
Phobos.prototype.configureScope = function configureScope(scopes, options) {
  this.scopes = scopes;

  if (typeof options === 'undefined') return this;

  for (var p in options) {
    if (options.model) this._options.scopeCarrier.model = options.model;
    if (options.field) this._options.scopeCarrier.field = options.field;
  }

  return this;
};

// Adds a Mongoose schema to our application
Phobos.prototype.addSchema = function schema(schema) {
  this.schema = schema;
  return this;
};

// Initializes the Phobos.DS object and returns it - useful for task runners
Phobos.prototype.initDb = function initDb() {
  if (this._databaseInitFlag) return this.DS;

  this.database.connect(this._options.dbUri);
  this.DS = {};

  var Schemas = (typeof this.schema === 'function') ? this.schema(this.database) : {};

  for (var s in Schemas) {
    if (Schemas.hasOwnProperty(s)) this.DS[s] = this.database.model(s, Schemas[s]);
  }

  this._databaseInitFlag = true;
  return this.DS;
};

// Simple way to include plugins into the app
Phobos.prototype.extend = function extend(name, func) {
  this[name] = func;
  return this;
};

// Internal function run when Phobos.start() is called
Phobos.prototype.prelaunchChecks = function prelaunch() {
  if (this._options.bearerTokenSignature === null) {
    console.error('!! Property `bearerTokenSignature` has not been defined and is required.');
    return false;
  }

  return true;
};

// This is the first piece of middleware in the app - used to attach important data to the req + res
Phobos.prototype.attach = function(req, res, next) {
  req.phobos = {};
  req.phobos.options = this._options;
  req.phobos.permissions = this.scopes;
  return next();
};

// Launches the server
Phobos.prototype.start = function start() {
  if (!this.prelaunchChecks()) return false;

  var options = this._options;
  this.server.use(this.attach);

  for (var n in this.expressPlugins) {
    this.server.use(this.expressPlugins[n].plugin(this.expressPlugins[n].opts));
  }

  this.server.listen(options.port, function() {
    console.log('=> ' + options.appName + ' server running on port ' + options.port);
  });

  return this;
};

module.exports = Phobos;
