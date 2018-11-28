const { bracketMap } = require('../util')

const makeNested = (type, scope = type) => ({
  begin: bracketMap[type][0],
  beginCaptures: {
    0: { name: `punctuation.section.${type}.begin.wolfram` }
  },
  end: bracketMap[type][1],
  endCaptures: {
    0: { name: `punctuation.section.${type}.end.wolfram` }
  },
  name: `meta.${scope}.wolfram`,
  patterns: [{
    include: '#expressions'
  }]
})

module.exports = {
  kind: 'scalar',
  construct(source) {
    return makeNested(...source.split(' '))
  }
}
