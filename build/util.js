const path = require('path')

function fullPath(filename) {
  return path.resolve(__dirname, '..', filename)
}

const bracketMap = {
  parens: ['\\(', '\\)'],
  parts: ['\\[\\[', '\\]\\]'],
  brackets: ['\\[', '\\]'],
  braces: ['{', '}'],
  association: ['<\\|', '\\|>'],
}

module.exports = {
  fullPath,
  bracketMap,
}
