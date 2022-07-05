//@ts-check
import { mergeSyntax, MacroParser, Traverser } from '../out/utilities/syntax'

import wordList, { named_characters } from '../dist/macros'
import { Command, Option, development, simplest, allPlugins } from 'commander'
import { Schema, Type, load } from 'js-yaml'
import { fullPath } from './util'
import { extname, join } from 'path'
import { readdirSync, readFileSync, writeFileSync } from 'fs'

new Command('-d, --development')
  .option('-s, --simplest')
  .option('-a, --all-plugins')
  .parse(process.argv)

const isDev = !!development
const BASIC_SYNTAX = 'basic.yaml'
const TYPES_DIR = fullPath('build/types')
const SYNTAX_DIR = fullPath('syntaxes')

named_characters = require('../out/resources/characters').map(item => item[1])

const macros = {}
for (const key in wordList) {
  macros[key] = wordList[key].join('|').replace(/\$/g, '\\$')
}

const macroParser = new MacroParser(macros)

const schema = Schema(
  readdirSync(TYPES_DIR)
    .filter(name => extname(name) === '.js')
    .map(name => new Type('!' + name.slice(0, -3), require(join(TYPES_DIR, name))))
)

const syntaxes = {}
const defaultPlugins = []

function parseContexts(filename) {
  const name = filename.slice(0, -5)
  const syntax = syntaxes[name] = load(
    readFileSync(join(SYNTAX_DIR, filename)),
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

  writeFileSync(
    fullPath('out/syntaxes', name + '.json'),
    isDev ? JSON.stringify(syntax, null, 2) : JSON.stringify(syntax),
  )

  return repository
}

[
  BASIC_SYNTAX,
  ...readdirSync(fullPath(SYNTAX_DIR))
    .filter(name => name !== BASIC_SYNTAX)
].map(parseContexts)

const base = simplest ? 'simplest' : 'basic'
const plugins = Array.from(function* (names) {
  for (const name of names) {
    if (name in syntaxes && name !== 'simplest' && name !== 'basic') {
      yield syntaxes[name]
    }
  }
}(allPlugins ? Object.keys(syntaxes) : defaultPlugins))

mergeSyntax(syntaxes[base], plugins, isDev)
