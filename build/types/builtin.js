function makeBuiltin(variable, scopeName) {
  return {
    match: `(?<![0-9a-zA-Z$\`])(System\`)?({{${variable}}})(?![0-9a-zA-Z$\`])`,
    name: scopeName + '.wolfram',
    captures: {
      1: { name: scopeName + '.context.wolfram' }
    }
  }
}

module.exports = {
  kind: 'scalar',
  construct: source => makeBuiltin(...source.split(' '))
}
