import * as fs from 'fs'
import * as utils from '.'
import * as Syntax from './syntax'

import DepSet from './depSet'
import Traverser from './traverser'

class EmbedTraverser extends Traverser {
  constructor(escape: string | RegExp, name: string, contexts) {
    const insertion = '.' + name
    const endPostfix = `|(?=${escape})`
    super({
      onRegex(source, key) {
        let result = source.replace(/"/g, '\\\\"')
        if (key === 'end') result += endPostfix
        return result
      },
      onName(name) {
        return name.replace(
          /(meta\.[\w.]+)(\.\w+)/g,
          (_, $1, $2) => $1 + insertion + $2
        )
      },
      onInclude(name) {
        if (name.endsWith(insertion) || !name.startsWith('#')) return name
        const origin = name.slice(1)
        if (contexts[origin + insertion] || (contexts[origin] || {})._clone) {
          return name + insertion
        } else {
          return name
        }
      }
    })
  }
}

// const embedInString = new EmbedTraverser('"', 'in-string', contexts)
// const embedInCell = new EmbedTraverser(/\*\)(\r?\n|\Z)/, 'in-cell', contexts)
  
// function parseExternalInclude(name) {
//   const extPath = util.vscPath('resources/app/extensions', name.match(/\.(\w+)$/)[1])
//   try {
//     const pj = require(extPath + '/package.json')
//     const lang = pj.contributes.grammars.find(({ scopeName }) => scopeName === name)
//     const stx = require(extPath + '/' + lang.path)

//     const exteralTraverser = new Traverser({
//       onRegex: parseInStringRegex,
//       onInclude(innerName) {
//         if (innerName.startsWith('#')) return `#${name}.${innerName.slice(1)}`
//         return parseExternalInclude(innerName)
//       }
//     })

//     repository[name] = { patterns: exteralTraverser.traverse(stx.patterns) }
//     for (const key in stx.repository) {
//       const rules = exteralTraverser.traverse([stx.repository[key]])
//       if (rules.length !== 1) throw new Error('')
//       repository[name + '.' + key] = rules[0]
//     }
//     return '#' + name
//   } catch (error) {
//     // console.error(error)
//     return name
//   }
// }

export default function mergeSyntax(base: Syntax.BaseSyntax, syntaxes: Syntax.Syntax[] = [], isDev = false) {
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
    if (!rootDep.count(key)) delete base.repository[key]
  }

  base.repository = new Traverser().traverseAll(base.repository)
  
  fs.writeFileSync(
    utils.fullPath('out/syntax.json'),
    isDev ? JSON.stringify(base, null, 2) : JSON.stringify(base),
  )
}
