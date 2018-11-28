const flatten = require('./flatten').construct

module.exports = {
  kind: 'sequence',
  construct: list => flatten(list).slice(0, -1)
}
