module.exports = {
  kind: 'scalar',
  construct() {
    return {
      patterns: [{
        match: `(?<![0-9a-zA-Z$\`])(System\`)?({{built_in_undocumented_symbols}})(?![0-9a-zA-Z$\`])`,
        name: 'support.function.undocumented.wolfram',
        captures: {
          1: { name: 'support.function.context.wolfram' }
        }
      }, {
        include: '#variable-basic'
      }],
    }
  }
}
