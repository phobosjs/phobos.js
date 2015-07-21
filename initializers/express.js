'use strict';

var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var responseTime = require('response-time');
var methodOverride = require('method-override');

var Server = function(express) {
  var server = express();

  server.use(bodyParser.text());
  server.use(bodyParser.json({ limit: '5MB' }));
  server.use(morgan('combined'));
  server.use(responseTime());
  server.use(methodOverride());

  server.use(cors({
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH', 'UPDATE', 'PUT'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Access-Control-Allow-Credentials', 'Accept', 'Content-Type'],
    origin: true
  }));

  return server;
};

module.exports = Server;
