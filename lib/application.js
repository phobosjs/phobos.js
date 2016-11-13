'use strict'

const koa = require('koa')
const router = require('koa-route')
const cors = require('koa-cors')
const logger = require('koa-logger')

const PhobosResource = require('./resource')
const PhobosRoute = require('./route')
const PhobosBase = require('./base')
const PhobosSerializer = require('./serializer')
const DefaultApplicationOptions = require('../config/application-options')

class PhobosApplication extends PhobosBase {

  constructor(options = {}) {
    super()

    this.options = Object.assign({
      serializer: PhobosSerializer
    }, DefaultApplicationOptions, options)

    this.resources = []
    this.routes = []
    this.schemas = []
    this.models = {}
    this.server = koa()
    this.router = router
  }

  resource(resource) {
    if (!(resource instanceof PhobosResource)) {
      return this.error(`Resource is not an instance of PhobosResource`)
    }

    this.resources[resource.path] = resource
  }

  route(route) {
    if (!(route instanceof PhobosRoute)) {
      return this.error(`Route is not an instance of PhobosRoute`)
    }

    this.routes[route.path] = route
  }

  setPhobosObject(phobos) {
    return function *(next) {
      this.phobos = { options: phobos.options }

      try {
        yield next
      } catch (error) {
        this.status = error.status || 500
        this.body = error.message

        this.app.emit('error', error, this)
      }
    }
  }

  start() {
    const serializer = new (this.options.serializer)()
    const store = {}

    this.server.use(logger())
    this.server.use(this.setPhobosObject(this))
    this.server.use(cors(this.options.cors))

    for (const resource in this.resources) {
      this.resources[resource].mount({
        server: this.server,
        router: this.router,
        serializer
      })

      store[this.resources[resource].name] = this.resources[resource]._schema(this.Model)
      Object.getPrototypeOf(this.resources[resource])
    }

    for (const route in this.routes) {
      this.routes[route].mount({
        server: this.server,
        router: this.router,
        serializer
      })
    }

    PhobosResource.store = store
    PhobosRoute.store = store

    this.log(`[INFO] Launching server on port ${this.options.port}`)
    this.server.listen(this.options.port)
  }

  get store() {
    if (this._store) return this._store

    return (StoreKlass, options) => {
      const db = new StoreKlass.Store()
      this._store = db.init(options)
      this.Model = StoreKlass.Model
    }
  }

}

module.exports = PhobosApplication
