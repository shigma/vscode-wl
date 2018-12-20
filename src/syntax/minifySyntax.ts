import DepSet from './depSet'
import Traverser from './traverser'
import { Rule, Repository } from '.'

export default function minifySyntax(patterns: Rule[], repository: Repository) {
  /** dependencies for all repositories */
  const deps: Record<string, DepSet> = {}

  for (const key in repository) {
    const { include, patterns } = repository[key]
    deps[key] = new DepSet()
    
    if (include && include[0] === '#') {
      deps[key].add(include.slice(1))
      continue
    }
    
    if (!patterns) continue
    repository[key].patterns = new Traverser({
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

  for (const rule of patterns) {
    if (rule.include && rule.include[0] === '#') {
      collectDep(rule.include.slice(1))
    }
  }

  return new Traverser({
    onContext: name => rootDep.count(name) > 1,
    onInclude(include) {
      const name = include.slice(1)
      const count = rootDep.count(name)
      if (!count) return
      return count === 1 ? this.repository[name] : include
    },
  }).traverseAll(repository)
}
