'use strict';

var express = require('express');
var mongoose = require('mongoose');

function Phobos(options) {
  this._options = {
    port: 9292,
    appName: 'Phobos.js',
    bearerTokenSignature: null,
    dbUri: 'mongodb://localhost/phobos'
  };

  for (var p in options) {
    if (this._options.hasOwnProperty(p)) this._options[p] = options[p];
  }

  this.server = express();
  this.expressPlugins = require('../plugins/express');

  this.database = mongoose.connect(this._options.dbUri);
  this.databasePlugins = {};
  this.DS;

  this.controllers = [];
  this.scopes = [];

  return this;
};

Phobos.prototype.addSchema = function schema(schema) {
  this.schema = schema;
  return this;
};

Phobos.prototype.initDb = function initDb() {
  this.DS = {};
  var Schemas = (typeof this.schema === 'function') ? this.schema(this.database) : {};

  for (var s in Schemas) {
    if (Schemas.hasOwnProperty(s)) this.DS[s] = this.database.model(s, Schemas[s]);
  }

  return this.DS;
};

Phobos.prototype.extend = function extend(name, func) {
  this[name] = func;
  return this;
};

Phobos.prototype.prelaunchChecks = function prelaunch() {
  if (this._options.bearerTokenSignature === null) {
    console.error('!! Property `bearerTokenSignature` has not been defined and is requred.');
    return false;
  }

  return true;
};

Phobos.prototype.start = function start() {
  if (!this.prelaunchChecks()) return false;

  var options = this._options;

  for (var n in this.expressPlugins) {
    this.server.use(this.expressPlugins[n].plugin(this.expressPlugins[n].opts));
  }

  this.server.listen(options.port, function() {
    console.log('=> ' + options.appName + ' server running on port ' + options.port);
  });

  return this;
};

module.exports = Phobos;
