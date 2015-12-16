'use strict';

var bodyParser = require('body-parser');

module.exports = {

  methodOverride: {
    plugin: require('method-override')
  },

  bodyParserText: {
    plugin: bodyParser.text
  },

  bodyParserJson: {
    plugin: bodyParser.json,
    opts: { limit: '5MB' }
  },

  morgan: {
    plugin: require('morgan'),
    opts: 'combined'
  },

  responseTime: {
    plugin: require('response-time')
  },

  cors: {
    plugin: require('cors'),
    opts: {
      methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH', 'UPDATE', 'PUT'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Access-Control-Allow-Credentials', 'Accept', 'Content-Type'],
      origin: true
    }
  },

  queryParams: {
    plugin: require('express-query-params')
  }

};
