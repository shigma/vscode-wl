const fs = require('fs')
const util = require('./util')
const usageData = require('../dist/usageAST')
const usageDict = {}

function isPlain(ast) {
  return typeof ast !== 'object' || ast[0] === 'StyleBox'
}

function parseString(source, codeForm = false) {
  source = String(source).slice(1, -1)
  if (source === ',') return ', '
  else if (source === '′') return '′'
  else if (source === '\uf3a0') return ''
  else if (source === '\uf431') return ' == '
  else if (source === '\uf522') return codeForm ? ' -> ' : ' → '
  else if (/^[:>+=*/@;.-]+$/.test(source)) return ' ' + source + ' '
  else if (/^([\w$`α-ω ]+|['"\[\]{}()…])$/.test(source)) return source
  else return source
}

function toCodeString(ast) {
  if (typeof ast !== 'object') return parseString(ast, true)
  switch (ast[0]) {
    case 'RowBox': return ast[1].slice(1).map(toCodeString).join('')
    case 'StyleBox': return toCodeString(ast[1])
    case 'SubscriptBox': return toCodeString(ast[1]) + toCodeString(ast[2])
    case 'SuperscriptBox': return toCodeString(ast[1]) + toCodeString(ast[2])
    case 'SubsuperscriptBox': return toCodeString(ast[1]) + toCodeString(ast[2]) + toCodeString(ast[3])
    case 'StringSequence': return ast.slice(1).map(toCodeString).join('')
    default: throw ast
  }
}

function toTextString(ast) {
  if (typeof ast !== 'object') return parseString(ast, false)
  switch (ast[0]) {
    case 'List':
      return ast.slice(1).map(toTextString).join('')
    case 'RowBox':
    case 'BoxData':
      return toTextString(ast[1])
    case 'Cell':
    case 'StyleBox': {
      let output = toTextString(ast[1])
      ast.slice(2).forEach(arg => {
        if (typeof arg !== 'string') {
          if (arg[0] === 'Rule') {
            // FIXME: anything to use?
            // ReplacedText: Link
          } else {
            throw arg
          }
          return
        }
        switch (arg.slice(1, -1)) {
          case 'MR':
          case 'TR':
          case 'MenuNameDelimiter':
            break
          case 'TI':
          case 'InlineFormula':
            output = `*${output}*`
            break
          case 'InlineCode':
            output = `\`${output}\``
            break
          case 'RebrandingTerm':
          case 'MenuName':
          case 'KeyEvent':
          case 'DialogElementName':
            output = `**${output}**`
            break
          default: throw arg.slice(1, -1)
        }
      })
      return output
    }
    case 'SqrtBox': {
      let inner = toTextString(ast[1])
      if (!isPlain(ast[1])) inner = `(${inner})`
      return '√' + inner
    }
    case 'RadicalBox': {
      let inner = toTextString(ast[1])
      if (!isPlain(ast[1])) inner = `(${inner})`
      let outer = toTextString(ast[2])
      if (!isPlain(ast[2])) outer = `(${outer})`
      return outer + '√' + inner
    }
    case 'FractionBox': {
      let numerator = toTextString(ast[1]);
      if (!isPlain(ast[1])) numerator = `(${numerator})`
      let denominator = toTextString(ast[2]);
      if (!isPlain(ast[2])) denominator = `(${denominator})`
      return numerator + '/' + denominator
    }
    case 'SubscriptBox': return toTextString(ast[1]) + toTextString(ast[2])
    case 'SuperscriptBox': return toTextString(ast[1]) + toTextString(ast[2])
    case 'SubsuperscriptBox': return toTextString(ast[1]) + toTextString(ast[2]) + toTextString(ast[3])
    case 'StringSequence': return ast.slice(1).map(toCodeString).join('')
    case 'CheckboxBox': return ast[1] ? '☑' : '☐'
    case 'OpenerBox': return ast[1] ? '▲' : '▼'
    case 'RadioButtonBox': return ast[1] ? '○' : '⦿'
    case 'TemplateBox':
    case 'UnderscriptBox':
    case 'OverscriptBox':
    case 'UnderoverscriptBox':
    case 'GridBox':
      // FIXME
      return ``
    case 'Times':
      // Error: An unknown box name was sent as the BoxForm for the expression.
      // Check the format rules for the expression.
      return ``
    default:
      throw ast
  }
}

class Usage extends Array {
  pushWithType(type, content) {
    if ((this[this.length - 1] || '').slice(0, 4) === type) {
      this[this.length - 1] += ' ' + content
    } else {
      this.push(type + ': ' + content)
    }
  }
}

for (const name in usageData) {
  CURRENT_NAME = name
  const usage = usageDict[name] = new Usage()
  if (typeof usageData[name] === 'string') {
    usageData[name] = ['StringSequence', usageData[name]]
  }

  let newline = true
  for (const part of usageData[name].slice(1)) {
    if (typeof part === 'string') {
      usage.pushWithType('text', part.replace(/\n/g, '\n\n').slice(1, -1).trim())
      newline = part.match(/\n\s*'$/)
    } else if (newline) {
      newline = false
      usage.pushWithType('code', toCodeString(part))
    } else {
      usage.pushWithType('text', toTextString(part))
    }
  }
}

fs.writeFileSync(
  util.fullPath('out/resources/usages.json'),
  JSON.stringify(usageDict, null, 2),
)
