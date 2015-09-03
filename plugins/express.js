'use strict';

var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var responseTime = require('response-time');
var methodOverride = require('method-override');
var queryParams = require('express-query-params');

module.exports = {

  bodyParserText: {
    plugin: bodyParser.text,
    opts: null
  },

  bodyParserJson: {
    plugin: bodyParser.json,
    opts: { limit: '5MB' }
  },

  morgan: {
    plugin: morgan,
    opts: 'combined'
  },

  responseTime: {
    plugin: responseTime,
    opts: null,
  },

  methodOverride: {
    plugin: methodOverride,
    opts: null
  },

  cors: {
    plugin: cors,
    opts: {
      methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH', 'UPDATE', 'PUT'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Access-Control-Allow-Credentials', 'Accept', 'Content-Type'],
      origin: true
    }
  },

  queryParams: {
    plugin: queryParams,
    opts: {}
  }

};
