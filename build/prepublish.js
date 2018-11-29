const util = require('./util')
const fs = require('fs')

function bundleJSON(file) {
  fs.writeFileSync(
    util.fullPath('out/' + file + '.json'),
    JSON.stringify(require('../out/' + file))
  )
}

bundleJSON('namespace')
bundleJSON('syntax')
