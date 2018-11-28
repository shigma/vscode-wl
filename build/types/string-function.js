const makeFunction = require('./function').construct
const makeFirst = require('./first').construct

module.exports = {
  kind: 'mapping',
  construct({ target, type, context }) {
    return makeFunction({
      target,
      type,
      context: makeFirst([{
        begin: '"',
        beginCaptures: { 0: { name: 'punctuation.definition.string.begin.wolfram' } },
        end: '"',
        endCaptures: { 0: { name: 'punctuation.definition.string.end.wolfram' } },
        name: `string.quoted.${type}.wolfram`,
        patterns: context,
      }])
    })
  }
}
