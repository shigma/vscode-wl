class Traverser {
  constructor({ parseName, parseRegex, parseInclude } = {}) {
    this.parseName = parseName
    this.parseRegex = parseRegex
    this.parseInclude = parseInclude
  }

  getCaptures(captures) {
    if (!captures) return
    const result = {}
    for (const index in captures) {
      const capture = result[index] = Object.assign({}, captures[index])
      capture.name = this.getName(capture.name)
      capture.patterns = this.getRules(capture.patterns)
    }
    return result
  }

  getName(name) {
    if (!name) return
    if (!this.parseName) return name
    return this.parseName(name)
  }

  getRegex(rule, key) {
    if (rule[key]) rule[key] = this.parseRegex(rule[key], key)
  }

  getInclude(name) {
    if (!name) return
    if (!this.parseInclude) return name
    return this.parseInclude(name)
  }

  getRule(rule) {
    if (typeof rule === 'string') return rule
    rule = Object.assign({}, rule)
    if (this.parseRegex) {
      this.getRegex(rule, 'match')
      this.getRegex(rule, 'begin')
      this.getRegex(rule, 'end')
    }
    rule.name = this.getName(rule.name)
    rule.contentName = this.getName(rule.contentName)
    rule.include = this.getInclude(rule.include)
    rule.patterns = this.getRules(rule.patterns)
    rule.captures = this.getCaptures(rule.captures)
    rule.endCaptures = this.getCaptures(rule.endCaptures)
    rule.beginCaptures = this.getCaptures(rule.beginCaptures)
    return rule
  }

  getRules(rules) {
    if (!rules) return
    return rules.map(rule => this.getRule(rule))
  }

  traverse(rules) {
    return this.getRules(rules)
  }
}

module.exports = Traverser
