import * as fs from 'fs'
import * as util from '.'
import * as Syntax from './syntax'
import minifySyntax from './minifySyntax'
import Traverser, { TraverseOptions } from './traverser'

interface EmbedOptions {
  name: string
  repository: Syntax.Repository
  onRegex: TraverseOptions["onRegex"]
}

class EmbedTraverser extends Traverser {
  constructor(options: EmbedOptions) {
    const insertion = '.' + options.name
    const endPostfix = `|(?=${escape})`
    super({
      onRegex: options.onRegex,
      onName: name => name.replace(
        /(meta\.[\w.]+)(\.\w+)/g,
        (_, $1, $2) => $1 + insertion + $2,
      ),
      onInclude(name) {
        if (name.endsWith(insertion) || !name.startsWith('#')) return name
        return options.repository[name.slice(1) + insertion] ? name + insertion : name
      },
    })
  }
}

export default function mergeSyntax(base: Syntax.BaseSyntax, syntaxes: Syntax.Syntax[] = [], isDev = false) {
  base._plugins = []

  // Step 1: merge all the plugins
  syntaxes.forEach(syntax => {
    base._plugins.push(syntax._name)
    Object.assign(base.repository, syntax.repository)
  })

  // Step 2: generate embedded contexts
  const stringEmbedder = new EmbedTraverser({
    name: 'in-string',
    repository: base.repository,
    onRegex(source, key) {
      let result = source.replace(/"/g, '\\\\"')
      if (key === 'end') result += `|(?=")`
      return result
    },
  })

  const commentEmbedder = new EmbedTraverser({
    name: 'in-comment',
    repository: base.repository,
    onRegex(source, key) {
      return key === 'end' ? source + `|(?=\\*\\)(\\r?\\n|\\Z))` : source
    },
  })

  function parseExternalInclude(this: Traverser, name: string): Syntax.Rule {
    const extPath = util.vscPath('resources/app/extensions', name.match(/\.(\w+)$/)[1])
    try {
      const { contributes } = require(extPath + '/package.json')
      const lang = contributes.grammars.find(({ scopeName }) => scopeName === name)
      const syntax = require(extPath + '/' + lang.path)

      const externalTraverser = new Traverser({
        onRegex: stringEmbedder.onRegex,
        onInclude: include => {
          if (include.startsWith('#')) {
            return include.startsWith('#external.')
              ? include
              : `#external.${name}:${include.slice(1)}`
          } else {
            return parseExternalInclude.call(this, include)
          }
        },
      })

      for (const key in syntax.repository) {
        const patterns = externalTraverser.traverse([syntax.repository[key]])
        this.repository[`external.${name}:${key}`] = { patterns }
      }

      return { patterns: externalTraverser.traverse(syntax.patterns) }
    } catch (error) {
      return { patterns: [] }
    }
  }
  
  base.repository = new Traverser({
    * onString(name) {
      if (name.startsWith('embed-in-string:')) {
        const target = name.slice(16)
        if (target.startsWith('external.')) {
          yield parseExternalInclude.call(this, target.slice(9))
        } else if (this.repository[target]) {
          yield* stringEmbedder.traverse([this.repository[target]]) as Syntax.Rule[]
        }
      } else if (name.startsWith('embed-in-comment:')) {
        const target = name.slice(17)
        yield* commentEmbedder.traverse([this.repository[target]]) as Syntax.Rule[]
      }
    },
  }).traverseAll(base.repository)
  
  // Step 3: minify the syntax definition
  base.repository = minifySyntax(base.patterns, base.repository)

  fs.writeFileSync(
    util.fullPath('out/syntax.json'),
    isDev ? JSON.stringify(base, null, 2) : JSON.stringify(base),
  )
}
