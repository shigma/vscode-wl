module.exports = {
  kind: 'sequence',
  construct(rules) {
    let escapes = '\\]'
    const index = rules.findIndex(rule => rule.escapes)
    if (index >= 0) escapes = rules[index].escapes
    return [
      ...rules.filter(rule => !rule.escapes).map(rule => {
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
