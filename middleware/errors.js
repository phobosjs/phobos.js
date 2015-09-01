'use strict';

module.exports = function(err, req, res, next) {
  return res.send({ error: err });
}
