const namespace = require('../../dist/namespace')

for (const key in namespace) {
  const systemSymbols = []
  const addonsSymbols = []
  namespace[key].forEach(name => {
    if (/^[\w$]+$/.test(name)) {
      systemSymbols.push(name)
    } else {
      addonsSymbols.push(name)
    }
  })
  namespace[key] =
    '(?<![0-9a-zA-Z$`])((System`)?(' + systemSymbols.join('|').replace(/\$/g, '\\$') +
    ')|' + addonsSymbols.join('|').replace(/\$/g, '\\$') + ')(?![0-9a-zA-Z$`])'
}

function makeBuiltin(variable, scope, contextScope = scope + '.context') {
  return variable in namespace ? {
    match: namespace[variable],
    name: scope + '.wolfram',
    captures: { 0: {
      patterns: [{
        match: '({{symbol}}`)*',
        name: contextScope + '.wolfram',
      }]
    } }
  } : {
    match: `(?<![0-9a-zA-Z$\`])(System\`)?({{${variable}}})(?![0-9a-zA-Z$\`])`,
    captures: { 1: { name: contextScope + '.wolfram' } },
    name: scope + '.wolfram',
  }
}

module.exports = {
  kind: 'scalar',
  construct: source => makeBuiltin(...source.split(' ')),
}
