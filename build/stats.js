const namespace = require('../dist/namespace')

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
