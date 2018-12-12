const makeRaw = require('./raw').construct

module.exports = {
  kind: 'scalar',
  construct: source => makeRaw({ 0: source })
}
