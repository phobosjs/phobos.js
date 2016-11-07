'use strict'

const chai = require('chai')
const glob = require('glob')

chai.use(require('chai-generator'))

for (const filename of glob.sync('./test/*/*.js')) {
  const path = filename.slice(7)
  const test = require(`./${path}`)
  const target = require(`../${path}`)

  describe(path, () => test(target, chai.expect))
}
