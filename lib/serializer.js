'use strict'

const PhobosBase = require('./base')

class PhobosSerializer extends PhobosBase {

  set format(func) {
    if (typeof func !== 'function') return this.error('Trying to set formatter of PhobosSerializer to a non-function')
    this._formatter = func
  }

  get format() {
    if (this._formatter) return this._formatter
    return this.defaultFormat
  }

  defaultFormat(resource, format) {
    switch (format) {
      default: return JSON.stringify(resource)
    }
  }

  out(resource, { envelope, format }) {
    if (!format) format = 'json'
    if (envelope && format === 'json') resource = { [envelope]: resource }

    return this.format(resource, format)
  }

}

module.exports = PhobosSerializer
