const all = require('./all').construct

function foreach(...args) {
  const name = args.length > 2 ? args[0] : 'parameter'
  const escapes = args.length > 1 ? args[args.length - 2] : '}\\]'
  const patterns = args[args.length - 1]
  return {
    begin: `(?=[^${escapes},])`,
    end: `(?=[${escapes}])|,`,
    endCaptures: all('punctuation.separator.sequence.wolfram'),
    contentName: `meta.${name}.wolfram`,
    patterns,
  }
}

module.exports = {
  kind: 'sequence',
  construct: args => foreach(...args)
}
