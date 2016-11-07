'use strict'

const PhobosBase = require('./base')

class PhobosRoute extends PhobosBase {

  constructor({ path, method, responder }) {
    this.path = path ? path : null
    this.method = method ? method : null
    this.responder = responder ? responder : null
  }

  mount({ server, router, serializer }) {
    if (!this.path) return this.error('Route does not have a path set')
    if (!this.method) return this.error('Route does not have a method set')
    if (!this.responder) return this.error('Route does not have a responder set')

    server.use(router[this.method](this.path, this.responder(serializer)))
  }

  set responder(responder) {
    if (typeof responder !== 'function') return this.error('Attempted to set a non-function as a responder')
    this._responder = responder
  }

  get responder() {
    if (this._responder) return this._responder

    return function *() {
      this.log(`[WARN]: Responder not implemented for: ${method.toUpperCase()} ${path}`)
      this.body = serializer.out({})
    }
  }

}

module.exports = PhobosRoute
