const mergeSyntax = require('../out/utilities/mergeSyntax').default
const Traverser = require('../out/utilities/Traverser').default
const MacroParser = require('./utils/macroParser')
const wordList = require('../dist/macros')
const program = require('commander')
const yaml = require('js-yaml')
const util = require('./util')
const path = require('path')
const fs = require('fs')

program.parse(process.argv)

const schema = yaml.Schema.create(
  fs.readdirSync(util.fullPath('build/types'))
    .filter(name => path.extname(name) === '.js')
    .map(name => new yaml.Type('!' + name.slice(0, -3), require(util.fullPath('build/types', name))))
)

const basicSyntax = yaml.safeLoad(fs.readFileSync(util.fullPath('src/syntaxes/basic.yaml')), { schema })
const simplestSyntax = yaml.safeLoad(fs.readFileSync(util.fullPath('src/syntaxes/simplest.yaml')), { schema })

const macros = {}
for (const key in wordList) {
  macros[key] = wordList[key].join('|').replace(/\$/g, '\\$')
}

const macroParser = new MacroParser(basicSyntax.variables).push(macros)
delete basicSyntax.variables
delete simplestSyntax.variables

function parseContexts(syntax, name) {
  const contexts = syntax.contexts
  const repository = {}
  
  function parseInStringRegex(source, key) {
    let result = source.replace(/"/g, '\\\\"')
    if (key === 'end') result += '|(?=")'
    return result
  }
  
  const cloneTraverser = new Traverser({
    onRegex: parseInStringRegex,
    onName(name) {
      return name.replace(
        /(meta\.[\w.]+\.)(wolfram)/g,
        (_, $1, $2) => $1 + 'in-string.' + $2
      )
    },
    onInclude(name) {
      if (name.endsWith('-in-string') || !name.startsWith('#')) return name
      const origin = name.slice(1)
      if (contexts[origin + '-in-string'] || (contexts[origin] || {})._clone) {
        return name + '-in-string'
      } else {
        return name
      }
    }
  })

  Object.keys(contexts).forEach(key => {
    const context = contexts[key]
    if (!context._clone) return
    contexts[key + '-in-string'] = cloneTraverser.traverse(context)
  })
  
  function parseExternalInclude(name) {
    const extPath = util.vscPath('resources/app/extensions', name.match(/\.(\w+)$/)[1])
    try {
      const pj = require(extPath + '/package.json')
      const lang = pj.contributes.grammars.find(({ scopeName }) => scopeName === name)
      const stx = require(extPath + '/' + lang.path)
  
      const exteralTraverser = new Traverser({
        onRegex: parseInStringRegex,
        onInclude(innerName) {
          if (innerName.startsWith('#')) return `#${name}.${innerName.slice(1)}`
          return parseExternalInclude(innerName)
        }
      })
  
      repository[name] = { patterns: exteralTraverser.traverse(stx.patterns) }
      for (const key in stx.repository) {
        const rules = exteralTraverser.traverse([stx.repository[key]])
        if (rules.length !== 1) throw new Error('')
        repository[name + '.' + key] = rules[0]
      }
      return '#' + name
    } catch (error) {
      // console.error(error)
      return name
    }
  }
  
  const macroTraverser = new Traverser({
    onInclude(name) {
      if (name.startsWith('#') || !name.endsWith('.in-string')) return name
      return parseExternalInclude(name.slice(0, -10))
    },
    onRegex(source) {
      return macroParser.resolve(source)
    },
  })

  for (const key in contexts) {
    repository[key] = { patterns: macroTraverser.traverse(contexts[key]) }
  }

  syntax._name = name
  syntax.repository = repository
  delete syntax.contexts

  fs.writeFileSync(util.fullPath('out/syntaxes', name + '.json'), JSON.stringify(syntax))
  return syntax
}

parseContexts(basicSyntax, 'basic')
parseContexts(simplestSyntax, 'simplest')

fs.readdirSync(util.fullPath('src/syntaxes')).map(name => {
  if (name === 'basic.yaml' || name === 'simplest.yaml') return
  const syntax = yaml.safeLoad(fs.readFileSync(util.fullPath('src/syntaxes', name)), { schema })
  parseContexts(syntax, name.slice(0, -5))
})

const baseSyntax = program.args.includes('simplest') ? simplestSyntax : basicSyntax

mergeSyntax(baseSyntax)
