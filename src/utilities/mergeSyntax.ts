import * as fs from 'fs'
import * as utils from '.'
import * as Syntax from './syntax'
import Traverser from './traverser'

interface DepItem {
  name: string
  count: number
}

class DepSet {
  private _list: DepItem[] = []
  public checked: boolean = false

  public get(name: string) {
    return this._list.find(item => item.name === name)
  }

  public add(name: string, count: number = 1) {
    const item = this.get(name)
    if (item) {
      item.count += count
    } else {
      this._list.push({ name, count })
    }
  }

  public count(name: string) {
    const item = this.get(name)
    return item ? item.count : 0
  }

  public each(callback: (name: string, count: number, index: number) => void) {
    this._list.forEach((item, index) => {
      callback(item.name, item.count, index)
    })
  }
}

export default function mergeSyntax(base: Syntax.BaseSyntax, ...syntaxes: Syntax.Syntax[]) {
  base._plugins = []
  syntaxes.forEach(syntax => {
    base._plugins.push(syntax._name)
    for (const key in syntax.repository) {
      if (key in base.repository) {
        const basePatterns = base.repository[key].patterns
        if (!basePatterns) return
        const index = basePatterns.findIndex(rule => rule === '__SLOT__')
        if (index !== -1) basePatterns.splice(index, 1, ...(syntax.repository[key].patterns || []))
      } else {
        base.repository[key] = syntax.repository[key]
      }
    }
  })

  /** dependencies for all repositories */
  const deps: Record<string, DepSet> = {}

  for (const key in base.repository) {
    deps[key] = new DepSet()
    const patterns = base.repository[key].patterns
    if (!patterns) continue

    base.repository[key].patterns = new Traverser({
      * onString() {},
      onInclude(include) {
        if (include[0] === '#') deps[key].add(include.slice(1))
        return include
      },
    }).traverse(patterns)
  }

  /** dependencies for root patterns */
  const rootDep = new DepSet()

  function collectDep(context: string, count: number = 1) {
    const depSet = deps[context]
    if (!depSet) return
    rootDep.add(context, count)
    if (depSet.checked) return
    depSet.checked = true
    depSet.each(collectDep)
  }

  for (const rule of base.patterns) {
    if (rule.include && rule.include[0] === '#') {
      collectDep(rule.include.slice(1))
    }
  }

  const traverser = new Traverser({
    onInclude(include) {
      const name = include.slice(1)
      const count = rootDep.count(name)
      if (!count) return
      if (count === 1) {
        const context = base.repository[name]
        delete base.repository[name]
        if (context.match || context.begin || context.end) {
          return [context]
        } else {
          return context.patterns as Syntax.Rule[]
        }
      }
      return include
    }
  })

  for (const key in base.repository) {
    if (!rootDep.count(key)) {
      delete base.repository[key]
      continue
    }
    const patterns = base.repository[key].patterns
    if (!patterns) continue

    base.repository[key].patterns = traverser.traverse(patterns)
  }

  fs.writeFileSync(utils.fullPath('out/syntax.json'), JSON.stringify(base))
}
