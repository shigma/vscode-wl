const {
  mergeSyntax,
  MacroParser,
  Traverser,
} = require('../out/utilities/syntax')

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
const TYPES_DIR = util.fullPath('build/types')
const SYNTAX_DIR = util.fullPath('src/syntaxes')

const macros = {}
for (const key in wordList) {
  macros[key] = wordList[key].join('|').replace(/\$/g, '\\$')
}

const baseMacroParser = new MacroParser(macros)

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
    fs.readFileSync(path.join(SYNTAX_DIR, filename)),
    { schema },
  )
  syntax._name = name

  const repository = syntax.repository = {}
  const contexts = syntax.contexts
  const macroParser = baseMacroParser.clone(syntax.variables)
  if (syntax.include) defaultPlugins.push(name) 
  delete syntax.contexts
  delete syntax.variables
  delete syntax.include
  
  const macroTraverser = new Traverser({
    onRegex: source => macroParser.resolve(source),
  })

  for (const key in contexts) {
    repository[key] = { patterns: macroTraverser.traverse(contexts[key]) }
  }

  fs.writeFileSync(
    util.fullPath('out/syntaxes', name + '.json'),
    isDev ? JSON.stringify(syntax, null, 2) : JSON.stringify(syntax),
  )

  return repository
}

fs.readdirSync(util.fullPath(SYNTAX_DIR)).map(parseContexts)

const base = program.args.includes('simplest') ? 'simplest' : 'basic'

mergeSyntax(syntaxes[base], defaultPlugins.map(name => syntaxes[name]), isDev)
