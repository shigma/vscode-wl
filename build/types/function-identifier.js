const builtin = require('./builtin').construct

module.exports = {
  kind: 'scalar',
  construct() {
    return {
      patterns: [
        { include: '#undocumented-function' },
        { include: '#variable-basic' },
      ],
    }
  }
}
