'use strict'

const Inflected = require('inflected')
const PhobosBase = require('./base')

class PhobosResource extends PhobosBase {

  constructor(name) {
    super()

    this.expose = [ 'index', 'show', 'update', 'delete', 'new' ]
    this.edges = []
    this.responders = []

    if (name) this.name = name
  }

  set index(responder) {
    if (typeof responder !== 'function') this.error('Responder must be a function')
    this.responders.index = responder
  }

  set show(responder) {
    if (typeof responder !== 'function') return this.error('Responder must be a function')
    this.responders.show = responder
  }

  set update(responder) {
    if (typeof responder !== 'function') return this.error('Responder must be a function')
    this.responders.update = responder
  }

  set delete(responder) {
    if (typeof responder !== 'function') return this.error('Responder must be a function')
    this.responders.delete = responder
  }

  set new(responder) {
    if (typeof responder !== 'function') return this.error('Responder must be a function')
    this.responders.new = responder
  }

  get index() {
    return this.getResponder('index')
  }

  get show() {
    return this.getResponder('show')
  }

  get update() {
    return this.getResponder('update')
  }

  get delete() {
    return this.getResponder('delete')
  }

  get new() {
    return this.getResponder('new')
  }

  get permissions() {
    if (!this.permissions) return { '*': true }
    return this.permissions
  }

  get path() {
    if (!this.name) return
    return Inflected.pluralize(this.name)
  }

  getResponder(action) {
    if (this.expose.indexOf(action) === -1) return
    if (typeof this.responders[action] === 'function') return this.responders[action]

    return this[`_${action}`]
  }

  permissions(permissions) {

  }

  edge(options = {}, responder) {

  }

  model(schema) {
    this._schema = schema
  }

  mount({ server, router, serializer }) {
    if (!this.name) return this.error('Resource does not have a name set')
    if (!this._schema) return this.error('Resource does not have a model schema')

    for (const action of this.expose) {
      switch (action) {

        case 'index':
          server.use(router.get(`/${this.path}`, this.index(serializer, this.path)))
          break

        case 'show':
          server.use(router.get(`/${this.path}/:id`, this.show(serializer, this.path)))
          break

        case 'update':
          server.use(router.put(`/${this.path}/:id`, this.update(serializer, this.path)))
          break

        case 'delete':
          server.use(router.delete(`/${this.path}/:id`, this.delete(serializer, this.path)))
          break

        case 'new':
          server.use(router.post(`/${this.path}`, this.new(serializer, this.path)))
          break

        default: continue

      }
    }
  }

  _index(serializer, resource) {
    return function *() {
      const options = {}

      if (this.phobos.options.serializerOptions.envelopes) options.envelope = Inflected.pluralize(resource)
      if (this.request.query.format) options.format = this.request.query.format

      this.body = serializer.out(this.resource || [], options)
    }
  }

  _new(serializer, resource) {
    return function *() {
      const options = {}

      if (this.phobos.options.serializerOptions.envelopes) options.envelope = resource
      if (this.request.query.format) options.format = this.request.query.format

      if (!this.resource) {
        this.app.emit('error', 404, this)
      } else {
        this.body = serializer.out(this.resource, options)
      }
    }
  }

  _show(serializer, resource) {
    return function *() {
      const options = {}

      if (this.phobos.options.serializerOptions.envelopes) options.envelope = resource
      if (this.request.query.format) options.format = this.request.query.format

      if (!this.resource) {
        this.app.emit('error', 404, this)
      } else {
        this.body = serializer.out(this.resource, options)
      }
    }
  }

  _update(serializer, resource) {
    return function *() {
      const options = {}

      if (this.phobos.options.serializerOptions.envelopes) options.envelope = resource
      if (this.request.query.format) options.format = this.request.query.format

      if (!this.resource) {
        this.app.emit('error', 404, this)
      } else {
        this.body = serializer.out(this.resource, options)
      }
    }
  }

  _delete(serializer, resource) {
    return function *() {
      const options = {}

      if (this.phobos.options.serializerOptions.envelopes) options.envelope = resource
      if (this.request.query.format) options.format = this.request.query.format

      if (!this.resource) {
        this.app.emit('error', 404, this)
      } else {
        this.body = serializer.out(this.resource, options)
      }
    }
  }

}

module.exports = PhobosResource
