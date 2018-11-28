module.exports = {
  kind: 'sequence',
  construct(patterns) {
    const escapes = patterns.find(rule => typeof rule === 'string') || '[,\\]}]'
    return {
      begin: `\\s*(\\{)(?={{balanced_braces}}\\}\\s*${escapes})`,
      beginCaptures: { 1: { name: 'punctuation.section.braces.begin.wolfram' } },
      end: '(?=[\\]])|}',
      endCaptures: { 0: { name: 'punctuation.section.braces.end.wolfram' } },
      name: 'meta.braces.wolfram',
      patterns: patterns.filter(rule => typeof rule !== 'string')
    }
  }
}
