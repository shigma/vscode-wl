const rawUsages = require('../dist/usages')
const { DocumentLexer } = require('@marklet/core')
const util = require('./util')
const fs = require('fs')

const usages = {}

const CODE_PREFIX = /^( *or *)?\uf7c1\uf7c9\uf7c8RowBox/

const lexer = new DocumentLexer({
  main: [{
    regex: /(\w+)\[/,
    type: 'function',
    prefix_regex: ']',
    push: 'main',
    token: ([_, name], args) => ({ name, args }),
  }, {
    regex: /"((\\"|[^"])*)"/,
    token: cap => {
      let out = cap[1].replace(/\\"/g, '"')
      if (out === '\u2026') return out
      if (out === '\uf522') return ' -> '
      if (out === ',') return ', '
      return out.replace(/^[^\w\[\]{}]+$/, str => ` ${str} `)
    }
  }, {
    regex: '{',
    prefix_regex: '}',
    push: 'main',
  }, {
    regex: /,|\s+/,
    token: null,
  }, {
    regex: '\\_(\w+)',
    token: ([_, text]) => text,
  }],
})

function toCode(node) {
  if (typeof node === 'string') return node
  switch (node.name) {
    case 'RowBox': return node.args[0].content.map(toCode).join('')
    case 'StyleBox': return node.args[1] === 'ShowStringCharacters->True'
      ? toCode(lexer.parse(node.args[0].slice(7, -3))[0] || node.args[0])
      : toCode(node.args[0])
    case 'SubscriptBox':
    case 'SuperscriptBox':
    case 'SubsuperscriptBox':
      return node.args.map(toCode).join('')
  }
}

function format(source) {
  return source.replace(
    /\\!\\\(\\\*(.+?)\\\)/g,
    (_, str) => toMarkdown(lexer.parse(str)[0]),
  )
}

function toMarkdown(node) {
  if (typeof node === 'string') return node
  switch (node.name) {
    case 'RowBox': return node.args[0].content.map(toMarkdown).join('')
    case 'StyleBox':
      if (node.args.length === 1) return toMarkdown(node.args[0])
      switch (node.args[1]) {
        case 'ShowStringCharacters->True': return format(node.args[0])
        case 'AutoSpacing->False': return toMarkdown(node.args[0]) // FIXME
        case 'MR': return toMarkdown(node.args[0])
        case 'TR': return toMarkdown(node.args[0])
        case 'TI': return `*${toMarkdown(node.args[0])}*`
        default: return `**${toMarkdown(node.args[0])}**`
      }
    case 'SubscriptBox':
    case 'SuperscriptBox':
    case 'SubsuperscriptBox':
      return node.args.map(toMarkdown).join('')
  }
}

for (const name in rawUsages) {
  usages[name] = []
  rawUsages[name].split(/\n/g).forEach((line, index) => {
    while (true) {
      const prefix = line.match(CODE_PREFIX)
      if (!prefix) break
      const code = line.match(/^.+?\uf7c0/)
      if (!code) break
      usages[name].push({
        type: 'code',
        content: toCode(lexer.parse(code[0].slice(prefix[0].length - 6, -1))[0]),
      })
      line = line.slice(code[0].length)
    }
    usages[name].push({
      type: 'text',
      content: line.replace(
        /\uf7c1\uf7c9\uf7c8(.+?)\uf7c0/g,
        (_, str) => toMarkdown(lexer.parse(str)[0]),
      ),
    })
  })
}

fs.writeFileSync(
  util.fullPath('out/usages.json'),
  JSON.stringify(usages),
)
