const mergeSyntax = require('../out/utilities/mergeSyntax').default
const Traverser = require('../out/utilities/Traverser').default
const MacroParser = require('./utils/macroParser')
const wordList = require('../dist/macros')
const program = require('commander')
const yaml = require('js-yaml')
const util = require('./util')
const path = require('path')
const fs = require('fs')

program
  .option('-d, --development')
  .option('-p, --production')
  .parse(process.argv)

const isDev = !!program.development

const macros = {}
for (const key in wordList) {
  macros[key] = wordList[key].join('|').replace(/\$/g, '\\$')
}

const TYPES_DIR = util.fullPath('build/types')
const SYNTAXES_DIR = util.fullPath('src/syntaxes')

const schema = yaml.Schema.create(
  fs.readdirSync(TYPES_DIR)
    .filter(name => path.extname(name) === '.js')
    .map(name => new yaml.Type('!' + name.slice(0, -3), require(path.join(TYPES_DIR, name))))
)

const syntaxes = {}
const defaultPlugins = []

function parseContexts(filename) {
  const name = filename.slice(0, -5)
  const syntax = syntaxes[name] = yaml.safeLoad(
    fs.readFileSync(path.join(SYNTAXES_DIR, filename)),
    { schema },
  )
  syntax._name = name

  const repository = syntax.repository = {}
  const contexts = syntax.contexts
  const macroParser = new MacroParser(syntax.variables).push(macros)
  if (syntax.include) defaultPlugins.push(name) 
  delete syntax.contexts
  delete syntax.variables
  delete syntax.include
  
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

  fs.writeFileSync(
    util.fullPath('out/syntaxes', name + '.json'),
    isDev ? JSON.stringify(syntax, null, 2) : JSON.stringify(syntax)
  )
}

fs.readdirSync(util.fullPath(SYNTAXES_DIR)).map(parseContexts)

const base = program.args.includes('simplest') ? 'simplest' : 'basic'

mergeSyntax(syntaxes[base], ...defaultPlugins.map(name => syntaxes[name]))
