const util = require('./util')
const fs = require('fs')

util.mkdir('out')
util.mkdir('out/utils')

fs.copyFileSync(
  util.fullPath('src/utils/syntax.js'),
  util.fullPath('out/utils/syntax.js'),
)

function bundleJSON(file) {
  fs.writeFileSync(
    util.fullPath('out/' + file + '.json'),
    JSON.stringify(require('../out/' + file))
  )
}

bundleJSON('namespace')
bundleJSON('syntax')
