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
  .option('-s, --simplest')
  .option('-a, --all-plugins')
  .parse(process.argv)

const isDev = !!program.development
const BASIC_SYNTAX = 'basic.yaml'
const TYPES_DIR = util.fullPath('build/types')
const SYNTAX_DIR = util.fullPath('src/syntaxes')

wordList.named_characters = require('../out/resources/characters').map(item => item[1])

const macros = {}
for (const key in wordList) {
  macros[key] = wordList[key].join('|').replace(/\$/g, '\\$')
}

const macroParser = new MacroParser(macros)

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
  const embedding = syntax.embedding || {}
  if (filename === BASIC_SYNTAX) macroParser.push(syntax.variables)
  if (syntax.include) defaultPlugins.push(name)
  delete syntax.contexts
  delete syntax.variables
  delete syntax.include
  delete syntax.embedding
  
  const macroTraverser = new Traverser({
    onRegex: source => macroParser.resolve(source),
  })

  const keys = Object.keys(contexts)
  for (const key of keys) {
    repository[key] = { patterns: macroTraverser.traverse(contexts[key]) }
  }

  for (const key of embedding.string === 'all' ? keys : embedding.string || []) {
    if (key.endsWith('.in-string') || key.endsWith('.in-comment') || !contexts[key]) continue
    repository[key + '.in-string'] = {
      patterns: ['embed-in-string:' + key]
    }
  }

  for (const key of embedding.comment === 'all' ? keys : embedding.comment || []) {
    if (key.endsWith('.in-string') || key.endsWith('.in-comment') || !contexts[key]) continue
    repository[key + '.in-comment'] = {
      patterns: ['embed-in-comment:' + key]
    }
  }

  fs.writeFileSync(
    util.fullPath('out/syntaxes', name + '.json'),
    isDev ? JSON.stringify(syntax, null, 2) : JSON.stringify(syntax),
  )

  return repository
}

[
  BASIC_SYNTAX,
  ...fs
    .readdirSync(util.fullPath(SYNTAX_DIR))
    .filter(name => name !== BASIC_SYNTAX)
].map(parseContexts)

const base = program.simplest ? 'simplest' : 'basic'
const plugins = Array.from(function*(names) {
  for (const name of names) {
    if (name in syntaxes && name !== 'simplest' && name !== 'basic') {
      yield syntaxes[name]
    }
  }
}(program.allPlugins ? Object.keys(syntaxes) : defaultPlugins))

mergeSyntax(syntaxes[base], plugins, isDev)
