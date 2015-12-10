'use strict';

/*
  middleware-manifest.js

  This has a list of all the middleware in Phobos's default stack. Additional
  middleware can be added into the stack after these.

  We don't include `base` because that is done by the router, as it will get
  different arguments depending on endpoint.
*/

var MiddlewareStack = [
  'bearer',
  'user',
  'query-parser',
  'includables',
  'query-runner',
  'scope-catch',
  'ownership',
  'apply-scope',
  'mutate',
  'filter-fields'
];

module.exports = MiddlewareStack;
