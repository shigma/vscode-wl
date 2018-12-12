import * as Syntax from './syntax'

type RegexType = 'begin' | 'match' | 'end'

interface TraverseOptions {
  onName?(name: string): string
  onRegex?(regex: string, key: RegexType): string
  onString?(source: string): IterableIterator<Syntax.Rule>
  onInclude?(include: string): string | Syntax.Rule[]
}

/** a textmate language patterns traverser */
export default class Traverser {
  private onName: (name: string) => string
  private onRegex: (regex: string, key: RegexType) => string
  private onString: (source: string) => IterableIterator<Syntax.Rule>
  private onInclude: (include: string) => string | Syntax.Rule[]

  constructor(options: TraverseOptions = {}) {
    this.onName = options.onName
    this.onRegex = options.onRegex
    this.onString = options.onString
    this.onInclude = options.onInclude
  }

  private getName(name: string): string {
    if (!name) return
    if (!this.onName) return name
    return this.onName(name)
  }

  private getCaptures(captures: Syntax.Captures): Syntax.Captures {
    if (!captures) return
    const result = {}
    for (const index in captures) {
      const capture = result[index] = Object.assign({}, captures[index])
      capture.name = this.getName(capture.name)
      capture.patterns = this.traverse(capture.patterns)
    }
    return result
  }

  private* getRules(rules: Syntax.SlotRule[]): IterableIterator<Syntax.SlotRule> {
    for (let rule of rules) {
      if (typeof rule === 'string') {
        if (this.onString) {
          yield* this.onString(rule)
        } else {
          yield rule
        }
        continue
      }
      rule = Object.assign({}, rule)
      if (this.onRegex) {
        for (const key of ['begin', 'match', 'end']) {
          if (rule[key]) rule[key] = this.onRegex(rule[key], key as RegexType)
        }
      }
      if (this.onInclude && rule.include) {
        const include = this.onInclude(rule.include)
        if (!include) continue
        if (typeof include !== 'string') {
          yield* include
          continue
        }
        rule.include = include
      }
      rule.name = this.getName(rule.name)
      rule.contentName = this.getName(rule.contentName)
      rule.patterns = this.traverse(rule.patterns)
      rule.captures = this.getCaptures(rule.captures)
      rule.endCaptures = this.getCaptures(rule.endCaptures)
      rule.beginCaptures = this.getCaptures(rule.beginCaptures)
      yield rule
    }
  }

  public traverse(rules: Syntax.SlotRule[]): Syntax.SlotRule[] {
    if (!rules) return
    return Array.from(this.getRules(rules))
  }
}
