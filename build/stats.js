const namespace = require('../dist/namespace')
const util = require('./util')
const fs = require('fs')

const isSystemSymbol = name => /^[\w$]+$/.test(name)

const categoryMap = {
  built_in_functions: 'Function',
  built_in_constants: 'Constant',
  built_in_options: 'Option',
  undocumented_symbols: 'Undocumented',
}

console.log(`\
| Category | System Symbols | AddOns Symbols |
|:--------:|:--------------:|:--------------:|`)

let systemTotal = 0, addonsTotal = 0

for (const key in namespace) {
  const systemCount = namespace[key].filter(isSystemSymbol).length
  const addonsCount = namespace[key].length - systemCount
  systemTotal += systemCount
  addonsTotal += addonsCount
  console.log(`| ${categoryMap[key]} | ${systemCount} | ${addonsCount} |`)
}

console.log(`| Total | ${systemTotal} | ${addonsTotal} |`)

const syntaxMap = {
  simplest: 'Simplest Mode',
  basic: 'Basic Syntax',
  'type-inference': 'Type Inference Plugin',
  'xml-template': 'XML Template Plugin',
}

console.log(`\
| Syntax Package | Minified Size |
|:--------------:|:-------------:|`)

for (const key in syntaxMap) {
  const { size } = fs.statSync(util.fullPath('out/syntaxes', key + '.json'))
  console.log(`| ${syntaxMap[key]} | ${(size / 1000).toFixed(2)} KB |`)
}
