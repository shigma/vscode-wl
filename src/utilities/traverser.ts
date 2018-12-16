import * as Syntax from './syntax'

type CapturesType = 'captures' | 'beginCaptures' | 'endCaptures'
type NameType = 'name' | 'contentName' | CapturesType
type RegexType = 'begin' | 'match' | 'end'

interface TraverseOptions {
  onName?(name: string, key: NameType): string
  onRegex?(regex: string, key: RegexType): string
  onString?(source: string): IterableIterator<Syntax.Rule>
  onInclude?(include: string): string | Syntax.Rule[]
  onContext?(include: string): boolean
}

/** a textmate language patterns traverser */
export default class Traverser {
  private onName: (name: string, key: NameType) => string
  private onRegex: (regex: string, key: RegexType) => string
  private onString: (source: string) => IterableIterator<Syntax.Rule>
  private onInclude: (include: string) => string | Syntax.Rule[]
  private onContext: (include: string) => boolean

  public repository: Syntax.Repository

  constructor(options: TraverseOptions = {}) {
    this.onName = options.onName
    this.onRegex = options.onRegex
    this.onString = options.onString
    this.onInclude = options.onInclude
    this.onContext = options.onContext
  }

  private getName(name: string, key: NameType): string {
    if (!name) return
    if (!this.onName) return name
    return this.onName(name, key)
  }

  private getCaptures(captures: Syntax.Captures, key: CapturesType): Syntax.Captures {
    if (!captures) return
    const result = {}
    for (const index in captures) {
      const capture = result[index] = Object.assign({}, captures[index])
      capture.name = this.getName(capture.name, key)
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

      if (rule.include) {
        if (this.onInclude) {
          const include = this.onInclude(rule.include)
          if (!include) continue
          if (typeof include !== 'string') {
            yield* include
            continue
          }
          rule.include = include
        }
        yield rule
        continue
      }

      rule.patterns = this.traverse(rule.patterns)
      if (rule.patterns && !(rule.begin || rule.end || rule.match)) {
        yield* rule.patterns
        continue
      }

      if (this.onRegex) {
        for (const key of ['begin', 'match', 'end']) {
          if (rule[key]) rule[key] = this.onRegex(rule[key], key as RegexType)
        }
      }
      rule.name = this.getName(rule.name, 'name')
      rule.contentName = this.getName(rule.contentName, 'contentName')
      rule.captures = this.getCaptures(rule.captures, 'captures')
      rule.endCaptures = this.getCaptures(rule.endCaptures, 'endCaptures')
      rule.beginCaptures = this.getCaptures(rule.beginCaptures, 'beginCaptures')
      yield rule
    }
  }

  public traverse(rules: Syntax.SlotRule[]): Syntax.SlotRule[] {
    if (!rules) return
    return Array.from(this.getRules(rules))
  }

  public traverseAll(contexts: Syntax.Repository) {
    contexts = Object.assign({}, this.repository = contexts)
    for (const key in contexts) {
      if (this.onContext && !this.onContext(key)) continue
      const patterns = this.traverse([contexts[key]])
      if (!patterns.length) {
        continue
      } else if (patterns.length === 1) {
        contexts[key] = patterns[0] as Syntax.Rule
      } else {
        contexts[key] = { patterns }
      }
    }
    return contexts
  }
}
