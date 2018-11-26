const yaml = require('js-yaml')
const util = require('./util')
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

const bracketMap = {
  parens: ['\\(', '\\)'],
  parts: ['\\[\\s*\\[', '\\]\\s*\\]'],
  brackets: ['\\[', '\\]'],
  braces: ['{', '}'],
  association: ['<\\|', '\\|>'],
}

const makeNested = (type, scope = type) => ({
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

function makeMatchFirst(rules) {
  let escapes = '\\]'
  const index = rules.findIndex(rule => rule.escapes)
  if (index >= 0) escapes = rules[index].escapes
  return [
    ...rules.filter(rule => !rule.escapes).map(rule => {
      rule.end = rule.end || `(?=[${escapes}])`
      rule.patterns = rule.patterns || [{ include: '#expressions' }]
      return rule
    }),
    {
      begin: `(?=[^${escapes}])`,
      end: `(?=[${escapes}])`,
      patterns: [{ include: '#expressions' }],
    }
  ]
}

const makeFunction = ({ target, context, type, identifier }) => ({
  begin: `(${target})\\s*(\\[(?!\\[))`,
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

const tagSchema = (type, kind, construct) => new yaml.Type(type, { kind, construct })

const schema = yaml.Schema.create([
  tagSchema('!builtin', 'scalar', source => {
    return `(?<![0-9a-zA-Z$\`])(?:System\`)?({{${source}}})(?![0-9a-zA-Z$\`])`
  }),
  tagSchema('!function', 'mapping', makeFunction),
  tagSchema('!match-first', 'sequence', makeMatchFirst),
  tagSchema('!string-function', 'mapping', ({ target, type, context }) => makeFunction({
    target,
    type,
    context: makeMatchFirst([{
      begin: '"',
      beginCaptures: { 0: { name: 'punctuation.definition.string.begin.wolfram' } },
      end: '"',
      endCaptures: { 0: { name: 'punctuation.definition.string.end.wolfram' } },
      name: `string.quoted.${type}.wolfram`,
      patterns: context,
    }])
  })),
  tagSchema('!function-identifier', 'scalar', () => ({
    name: 'entity.name.function.wolfram',
    patterns: [{ include: '#function-identifier' }],
  })),
  tagSchema('!no-whitespace', 'scalar', str => {
    return str.split(/\r?\n/g).map(str => str.replace(/(#.*)?$/, '').trim()).join('')
  }),
  tagSchema('!push', 'scalar', source => [{ include: '#' + source }]),
  tagSchema('!raw', 'mapping', transfer(data => typeof data === 'string' ? { name: data } : data)),
  tagSchema('!all', 'scalar', name => ({ 0: { name } })),
  tagSchema('!nested', 'scalar', source => makeNested(...source.split(' '))),
  tagSchema('!clone', 'sequence', rules => (rules._clone = true, rules))
])

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
      result[index].patterns = traverseRules(captures[index].patterns)
    }
    return result
  }
  
  function traverseRules(rules) {
    if (!rules) return
    return rules.map(rule => {
      rule = Object.assign({}, rule)
      if (rule.match) rule.match = rule.match.replace(/"/g, '\\"')
      if (rule.begin) rule.begin = rule.begin.replace(/"/g, '\\"')
      if (rule.end) rule.end = rule.end.replace(/"/g, '\\"') + '|(?=")'
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
