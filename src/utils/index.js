const path = require('path')

function fullPath(...filenames) {
  return path.resolve(__dirname, '../..', ...filenames)
}

module.exports = {
  fullPath,
}
