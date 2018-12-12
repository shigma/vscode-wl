import * as fs from 'fs'
import * as utils from '.'
import * as Syntax from './syntax'
import Traverser from './traverser'

interface DepItem {
  name: string
  count: number
}

class DepSet {
  _list: DepItem[] = []
  checked: boolean = false

  add(name: string, count: number = 1) {
    const item = this._list.find(item => item.name === name)
    if (item) {
      item.count += count
    } else {
      this._list.push({ name, count })
    }
  }

  count(name: string) {
    const item = this._list.find(item => item.name === name)
    return item ? item.count : 0
  }

  each(callback: (name: string, count: number, index: number, array: DepItem[]) => void) {
    this._list.forEach((item, index, array) => {
      callback(item.name, item.count, index, array)
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
    rootDep.add(context, count)
    const depSet = deps[context]
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
      console.log(name, count)
      if (!count) return
      if (count === 1) {
        const context = base.repository[name]
        delete base.repository[name]
        return [context]
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
