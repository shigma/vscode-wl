const yaml = require('js-yaml')
const util = require('./util')
const fs = require('fs')

const schema = yaml.Schema.create(
  fs.readdirSync(util.fullPath('build/types')).map(name => {
    return new yaml.Type(
      '!' + name.slice(0, -3),
      require(util.fullPath('build/types', name))
    )
  })
)

const syntax = yaml.safeLoad(fs.readFileSync(util.fullPath('src/syntax.yaml')), { schema })

function resolve(variables, regex) {
  if (!regex) return
  let output = regex
  for (const key in variables) {
    output = output.replace(new RegExp(`{{${key}}}`, 'g'), variables[key])
  }
  return output
}

const variables = Object.assign(
  util.transfer(list => list.join('|').replace(/\$/g, '\\$'))(require('../dist/macros')),
  util.transfer((item, _, variables) => resolve(variables, item))(syntax.variables),
)

class Traverser {
  constructor({ parseName, parseRegex, parseInclude } = {}) {
    this.parseName = parseName
    this.parseRegex = parseRegex
    this.parseInclude = parseInclude
  }

  getCaptures(captures) {
    if (!captures) return
    const result = {}
    for (const index in captures) {
      const capture = result[index] = Object.assign({}, captures[index])
      capture.name = this.getName(capture.name)
      capture.patterns = this.getRules(capture.patterns)
    }
    return result
  }

  getName(name) {
    if (!name) return
    if (!this.parseName) return name
    return this.parseName(name)
  }

  getRegex(rule, key) {
    if (rule[key]) rule[key] = this.parseRegex(rule[key], key)
  }

  getInclude(name) {
    if (!name) return
    if (!this.parseInclude) return name
    return this.parseInclude(name)
  }

  getRule(rule) {
    rule = Object.assign({}, rule)
    if (this.parseRegex) {
      this.getRegex(rule, 'match')
      this.getRegex(rule, 'begin')
      this.getRegex(rule, 'end')
    }
    rule.name = this.getName(rule.name)
    rule.contentName = this.getName(rule.contentName)
    rule.include = this.getInclude(rule.include)
    rule.patterns = this.getRules(rule.patterns)
    rule.captures = this.getCaptures(rule.captures)
    rule.endCaptures = this.getCaptures(rule.endCaptures)
    rule.beginCaptures = this.getCaptures(rule.beginCaptures)
    return rule
  }

  getRules(rules) {
    if (!rules) return
    return rules.map(rule => this.getRule(rule))
  }

  traverse(rules) {
    return this.getRules(rules)
  }
}

function parseInStringRegex(source, key) {
  let result = source.replace(/"/g, '\\\\"')
  if (key === 'end') result += '|(?=")'
  return result
}

const cloneTraverser = new Traverser({
  parseRegex: parseInStringRegex,
  parseName(name) {
    return name.replace(
      /(meta\.[\w.]+\.)(wolfram)/g,
      (_, $1, $2) => $1 + 'in-string.' + $2
    )
  },
  parseInclude(name) {
    if (name.endsWith('-in-string') || !name.startsWith('#')) return name
    const origin = name.slice(1)
    if (syntax.contexts[origin + '-in-string'] || (syntax.contexts[origin] || {})._clone) {
      return name + '-in-string'
    } else {
      return name
    }
  }
})

Object.keys(syntax.contexts).forEach(key => {
  const context = syntax.contexts[key]
  if (!context._clone) return
  syntax.contexts[key + '-in-string'] = cloneTraverser.traverse(context)
})

function parseExternalInclude(name) {
  const extPath = util.vscPath('resources/app/extensions', name.match(/\.(\w+)$/)[1])
  try {
    const pj = require(extPath + '/package.json')
    const lang = pj.contributes.grammars.find(({ scopeName }) => scopeName === name)
    const stx = require(extPath + '/' + lang.path)

    const exteralTraverser = new Traverser({
      parseRegex: parseInStringRegex,
      parseInclude(innerName) {
        if (innerName.startsWith('#')) return `#${name}.${innerName.slice(1)}`
        return parseExternalInclude(innerName)
      }
    })

    exteralContexts[name] = { patterns: exteralTraverser.traverse(stx.patterns) }
    for (const key in stx.repository) {
      exteralContexts[name + '.' + key] = exteralTraverser.getRule(stx.repository[key])
    }
    return '#' + name
  } catch (error) {
    // console.error(error)
    return name
  }
}

const exteralContexts = {}

const macroTraverser = new Traverser({
  parseInclude(name) {
    if (name.startsWith('#') || !name.endsWith('.in-string')) return name
    return parseExternalInclude(name.slice(0, -10))
  },
  parseRegex(source) {
    return resolve(variables, source)
  },
})

syntax.repository = Object.assign(exteralContexts, util.transfer(
  'patterns',
  macroTraverser.traverse.bind(macroTraverser)
)(syntax.contexts))

delete syntax.variables
delete syntax.contexts

fs.writeFileSync(
  util.fullPath('out/syntax.json'),
  JSON.stringify(syntax, null, 2),
)
