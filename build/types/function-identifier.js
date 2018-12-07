const builtin = require('./builtin').construct

module.exports = {
  kind: 'scalar',
  construct() {
    return {
      patterns: [
        { include: '#undocumented-function' },
        { include: '#variable-basic' },
        {
          match: '(`?(?:{{symbol}}`)*){{symbol}}',
          name: 'entity.name.function.wolfram',
          captures: {
            1: { name: 'entity.name.function.context.wolfram' }
          }
        }
      ],
    }
  }
}
