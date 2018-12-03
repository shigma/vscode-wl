module.exports = {
  kind: 'scalar',
  construct() {
    return {
      patterns: [{
        include: '#function-identifier'
      }, {
        match: '((?:{{symbol}}`)*){{symbol}}',
        name: 'entity.name.function.wolfram',
        captures: {
          1: { name: 'entity.name.function.context.wolfram' }
        },
      }],
    }
  }
}
