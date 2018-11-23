const yaml = require('js-yaml')
const util = require('./util')
const fs = require('fs')

function randomID(length = 6) {
  return Math.floor(Math.random() * 36 ** length).toString(36).padStart(length, '0')
}

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

const bracketMap = {
  parens: ['\\(', '\\)'],
  parts: ['\\[\\s*\\[', '\\]\\s*\\]'],
  brackets: ['\\[', '\\]'],
  braces: ['{', '}'],
  association: ['<\\|', '\\|>'],
}

const nested = (type, scope = type) => ({
  begin: bracketMap[type][0],
  beginCaptures: {
    0: { name: `punctuation.section.${type}.begin.wolfram` }
  },
  end: bracketMap[type][1],
  endCaptures: {
    0: { name: `punctuation.section.${type}.end.wolfram` }
  },
  name: `meta.${scope}.wolfram`,
  patterns: [{
    include: '#expressions'
  }]
})

const schema = yaml.Schema.create([
  new yaml.Type('!builtin', {
    kind: 'scalar',
    construct: source => `(?<!{{word_character}})(?:System\`)?({{${source}}})(?!{{word_character}})`
  }),
  new yaml.Type('!function', {
    kind: 'mapping',
    construct: ({ target, context, type, identifier }) => ({
      begin: `({{${target}}})\\s*(\\[(?!\\[))`,
      beginCaptures: {
        1: identifier ||
          { name: `${ type ? 'support.function.' + type : 'entity.name.function' }.wolfram` },
        2: { name: 'punctuation.section.brackets.begin.wolfram' },
      },
      end: '\\]',
      endCaptures: {
        0: { name: 'punctuation.section.brackets.end.wolfram' },
      },
      contentName: 'meta.block.wolfram',
      patterns: context || [{ include: '#expressions' }],
    })
  }),
  new yaml.Type('!match-first', {
    kind: 'mapping',
    construct(rule) {
      const escapes = rule.escapes || '\\]'
      const end = `(?=[${escapes}])`
      delete rule.escapes
      rule.end = rule.end || end
      rule.patterns = rule.patterns || [{ include: '#expressions' }]
      return [rule, {
        begin: `(?=[^${escapes}])`,
        end: `(?=[${escapes}])`,
        patterns: [{ include: '#expressions' }],
      }]
    }
  }),
  new yaml.Type('!function-identifier', {
    kind: 'scalar',
    construct: () => ({
      name: 'entity.name.function.wolfram',
      patterns: [{ include: '#function-identifier' }],
    })
  }),
  new yaml.Type('!no-whitespace', {
    kind: 'scalar',
    construct: str => str.split(/\r?\n/g).map(str => str.replace(/(#.*)?$/, '').trim()).join('')
  }),
  new yaml.Type('!push', {
    kind: 'scalar',
    construct: source => [{ include: '#' + source }]
  }),
  new yaml.Type('!raw', {
    kind: 'mapping',
    construct: transfer(data => typeof data === 'string' ? { name: data } : data)
  }),
  new yaml.Type('!all', {
    kind: 'scalar',
    construct: name => ({ 0: { name } })
  }),
  new yaml.Type('!nested', {
    kind: 'scalar',
    construct: source => nested(...source.split(' '))
  }),
])

const syntax = yaml.safeLoad(
  fs.readFileSync(util.fullPath('src/syntaxes/wolfram.yaml')),
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

function traverseRules(rules) {
  if (!rules) return
  rules.forEach(rule => {
    rule.match = resolve(variables, rule.match)
    rule.begin = resolve(variables, rule.begin)
    rule.end = resolve(variables, rule.end)
    traverseRules(rule.patterns)
    traverseCaptures(rule.captures)
    traverseCaptures(rule.endCaptures)
    traverseCaptures(rule.beginCaptures)
  })
  return rules
}

function traverseCaptures(captures) {
  if (!captures) return
  for (const index in captures) {
    traverseRules(captures[index].patterns)
  }
}

syntax.repository = transfer('patterns', traverseRules)(syntax.contexts)

delete syntax.variables
delete syntax.contexts

fs.writeFileSync(
  util.fullPath('syntaxes/wolfram.tmLanguage.json'),
  JSON.stringify(syntax),
)
