import * as fs from 'fs'
import * as utils from '.'
import * as Syntax from './syntax'

import Traverser from './traverser'
import minifySyntax from './minifySyntax'

class EmbedTraverser extends Traverser {
  constructor(escape: string | RegExp, name: string, repository: Syntax.Repository) {
    const insertion = '.' + name
    const endPostfix = `|(?=${escape})`
    super({
      onRegex(source, key) {
        let result = source.replace(/"/g, '\\\\"')
        if (key === 'end') result += endPostfix
        return result
      },
      onName: name => name.replace(
        /(meta\.[\w.]+)(\.\w+)/g,
        (_, $1, $2) => $1 + insertion + $2,
      ),
      onInclude(name) {
        if (name.endsWith(insertion) || !name.startsWith('#')) return name
        return repository[name.slice(1) + insertion] ? name + insertion : name
      },
    })
  }
}

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

  // Step 1: merge all the plugins
  syntaxes.forEach(syntax => {
    base._plugins.push(syntax._name)
    Object.assign(base.repository, syntax.repository)
  })

  // Step 2: generate embedded contexts
  const stringEmbedder = new EmbedTraverser('"', 'in-string', base.repository)
  // const embedInCell = new EmbedTraverser(/\*\)(\r?\n|\Z)/, 'in-cell', base.repository)
  
  base.repository = new Traverser({
    * onString(name) {
      if (name.startsWith('embed-in-string:')) {
        yield* stringEmbedder.traverse([this.repository[name.slice(16)]]) as Syntax.Rule[]
      }
    },
  }).traverseAll(base.repository)
  
  // Step 3: minify the syntax definition
  base.repository = minifySyntax(base.patterns, base.repository)

  fs.writeFileSync(
    utils.fullPath('out/syntax.json'),
    isDev ? JSON.stringify(base, null, 2) : JSON.stringify(base),
  )
}
