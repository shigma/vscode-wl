module.exports = {
  kind: 'scalar',
  construct(postfix) {
    return {
      begin: '\\s*({{identifier}})' + (postfix || '(?=\\s*[,}\\]])'),
      beginCaptures: { 1: { name: 'variable.parameter.wolfram' } }
    }
  }
}
