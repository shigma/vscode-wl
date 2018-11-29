const yaml = require('js-yaml')
const util = require('./util')
const path = require('path')
const fs = require('fs')

function transfer(...args) {
  args = args.map(arg => typeof arg === 'string'
    ? data => ({ [arg]: data })
    : arg)
  return source => {
    const output = {}
    for (const key in source) {
      output[key] = args.reduceRight((prev, curr) => curr(prev, key, output), source[key])
    }
    return output
  }
}

const typesDir = util.fullPath('build/types')

const schema = yaml.Schema.create(
  fs.readdirSync(typesDir).map(name => {
    return new yaml.Type('!' + name.slice(0, -3), require(path.resolve(typesDir, name)))
  })
)

const syntax = yaml.safeLoad(
  fs.readFileSync(util.fullPath('src/syntax.yaml')),
  { schema },
)

function resolve(variables, regex) {
  if (!regex) return
  let output = regex
  for (const key in variables) {
    output = output.replace(new RegExp(`{{${key}}}`, 'g'), variables[key])
  }
  return output
}

const variables = Object.assign(
  transfer(list => list.join('|').replace(/\$/g, '\\$'))(require('../dist/macros')),
  transfer((item, _, variables) => resolve(variables, item))(syntax.variables)
)

const traverse = (() => {
  function traverseCaptures(captures) {
    if (!captures) return
    const result = {}
    for (const index in captures) {
      result[index] = Object.assign({}, captures[index])
      result[index].name = traverseName(result[index].name)
      result[index].patterns = traverseRules(captures[index].patterns)
    }
    return result
  }

  function traverseName(name) {
    if (!name) return
    return name.replace(/(meta\.[\w.]+\.)(wolfram)/g, (_, $1, $2) => $1 + 'in-string.' + $2)
  }
  
  function traverseRules(rules) {
    if (!rules) return
    return rules.map(rule => {
      rule = Object.assign({}, rule)
      if (rule.match) rule.match = rule.match.replace(/"/g, '\\\\"')
      if (rule.begin) rule.begin = rule.begin.replace(/"/g, '\\\\"')
      if (rule.end) rule.end = rule.end.replace(/"/g, '\\\\"') + '|(?=")'
      rule.name = traverseName(rule.name)
      rule.contentName = traverseName(rule.contentName)
      rule.patterns = traverseRules(rule.patterns)
      rule.captures = traverseCaptures(rule.captures)
      rule.endCaptures = traverseCaptures(rule.endCaptures)
      rule.beginCaptures = traverseCaptures(rule.beginCaptures)
      if (rule.include && (
        syntax.contexts[rule.include.slice(1) + '-in-string'] ||
        (syntax.contexts[rule.include.slice(1)] || {})._clone)) {
        rule.include += '-in-string'
      }
      return rule
    })
  }

  return traverseRules
})()

Object.keys(syntax.contexts)
  .forEach(key => {
    const context = syntax.contexts[key]
    if (!context._clone) return
    syntax.contexts[key + '-in-string'] = traverse(context)
  })

syntax.repository = transfer('patterns', ((resolve) => {
  function traverseCaptures(captures) {
    if (!captures) return
    for (const index in captures) {
      traverseRules(captures[index].patterns)
    }
  }
  
  function traverseRules(rules) {
    if (!rules) return
    rules.forEach(rule => {
      rule.match = resolve(rule.match, 'match')
      rule.begin = resolve(rule.begin, 'begin')
      rule.end = resolve(rule.end, 'end')
      traverseRules(rule.patterns)
      traverseCaptures(rule.captures)
      traverseCaptures(rule.endCaptures)
      traverseCaptures(rule.beginCaptures)
    })
    return rules
  }

  return traverseRules
})(regex => resolve(variables, regex)))(syntax.contexts)

delete syntax.variables
delete syntax.contexts

fs.writeFileSync(
  util.fullPath('out/syntax.json'),
  JSON.stringify(syntax, null, 2),
)
