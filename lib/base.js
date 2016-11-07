'use strict'

const PhobosError = require('./error')

class PhobosBase {

  error(error) {
    throw new Error(error)
  }

  log() {
    console.log(...arguments)
  }

}

module.exports = PhobosBase
