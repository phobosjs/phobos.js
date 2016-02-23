'use strict';

/*
  error.js

  This is the default error handler. It barfs the error to STDOUT and responds
  with a consistent JSON object.
*/

function errorObject(err) {
  let error = {
    code: err.code || 500,
    translation: err.translation || 'error.api.miscellaneous'
  };

  if (err.message) error.message = err.message;

  return error;
}

module.exports = (err, req, res, next) => {
  let responseCode = 500;
  let response = {
    status: 'error',
    errors: []
  };

  response.errors.push(errorObject(err));

  if (response.errors.length < 1) {
    response.errors.push(errorObject({}));
  } else {
    responseCode = response.errors[0].code;
  }

  console.log(err);
  return res.status(responseCode).send(response);
};
