const path = require('path')

function fullPath(filename) {
  return path.resolve(__dirname, '..', filename)
}

module.exports = {
  fullPath
}
