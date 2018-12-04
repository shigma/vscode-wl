const util = require('./util')
const fs = require('fs')

util.mkdir('out')
util.mkdir('out/utils')

function bundleJSON(file) {
  fs.writeFileSync(
    util.fullPath('out/' + file + '.json'),
    JSON.stringify(require('../out/' + file))
  )
}

fs.readdirSync(util.fullPath('src/utils')).forEach(name => {
  fs.copyFileSync(
    util.fullPath('src/utils', name),
    util.fullPath('out/utils', name),
  )
})

bundleJSON('namespace')
bundleJSON('syntax')
