module.exports = {
  kind: 'sequence',
  construct(rules) {
    const index = rules.findIndex(rule => typeof rule === 'string')
    const escapes = index >= 0 ? rules[index] : '\\]'
    return [
      ...rules.filter(rule => typeof rule !== 'string').map(rule => {
        if (rule.include) return rule
        rule.end = rule.end || `(?=[${escapes}])`
        rule.patterns = rule.patterns || [{ include: '#expressions' }]
        return rule
      }),
      {
        begin: `(?=[^${escapes}])`,
        end: `(?=[${escapes}])`,
        patterns: [{ include: '#expressions' }],
      }
    ]
  }
}
