import * as fs from 'fs'
import * as utils from '.'
import * as Syntax from './syntax'
import Traverser from './traverser'

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
  const deps: Record<string, Set<string>> = {}

  for (const key in base.repository) {
    deps[key] = new Set<string>()
    const patterns = base.repository[key].patterns
    if (!patterns) continue

    base.repository[key].patterns = new Traverser({
      * onString() {},
      onInclude(include) {
        if (include[0] === '#') {
          deps[key].add(include.slice(1))
        }
        return include
      },
    }).traverse(patterns)
  }

  /** dependencies for root patterns */
  const rootDep = new Set<string>()

  function collectDep(context: string) {
    const subcontexts = deps[context]
    if (!subcontexts) return
    rootDep.add(context)
    delete deps[context]
    for (const subcontext of subcontexts) {
      collectDep(subcontext)
    }
  }

  for (const rule of base.patterns) {
    if (rule.include && rule.include[0] === '#') collectDep(rule.include.slice(1))
  }

  const traverser = new Traverser({
    onInclude(include) {
      if (!rootDep.has(include.slice(1))) return
      return include
    }
  })

  for (const key in base.repository) {
    if (!rootDep.has(key)) {
      delete base.repository[key]
      continue
    }
    const patterns = base.repository[key].patterns
    if (!patterns) continue

    base.repository[key].patterns = traverser.traverse(patterns)
  }

  fs.writeFileSync(utils.fullPath('out/syntax.json'), JSON.stringify(base))
}
