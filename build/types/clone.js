const flatten = require('./flatten').construct

module.exports = {
  kind: 'sequence', 
  construct(rules) {
    const result = flatten(rules)
    result._clone = true
    return result
  }
}
