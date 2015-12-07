'use strict';

exports.siftPermissionMatrix = function(matrix, scopes) {
  if (matrix === true) return scopes[scopes.length - 1];
  if (matrix === false) return matrix;
  if (typeof matrix !== 'object' || Object.keys(matrix).length === 0) return false;

  var grant = false;

  for (var i = 0; i < scopes.length; i++) {
    if (matrix[scopes[i]]) grant = scopes[i];
  }

  return grant;
};

exports.determineRequestType = function(req) {
  var methods = ['GET', 'POST', 'PUT', 'DELETE'];
  var action = ['read', 'create', 'edit', 'delete'];
  var index = methods.indexOf(req.method);

  if (index === -1) return 'read';

  return action[index];
}
