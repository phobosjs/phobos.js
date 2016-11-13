'use strict'

const mainMiddleware = function(stack) {
  return function *(next) {
    for (const mware in stack) {
      this[mware] = yield stack[mware]
    }
  }
}

module.exports = mainMiddleware
