const fs = require('fs')
const utils = require('.')

function mergeSyntax(base, ...syntaxes) {
  syntaxes.forEach(syntax => {
    for (const key in syntax.repository) {
      if (key in base.repository) {
        const basePatterns = base.repository[key].patterns
        if (!basePatterns) return
        const index = basePatterns.findIndex(rule => rule === '__SLOT__')
        if (index !== -1) basePatterns.splice(index, syntax.repository[key].patterns || [])
      } else {
        base.repository[key] = syntax.repository[key]
      }
    }
  })

  for (const key in base.repository) {
    const basePatterns = base.repository[key].patterns
    if (!basePatterns) return
    base.repository[key].patterns = basePatterns.filter(rule => typeof rule !== 'string')
  }

  fs.writeFileSync(utils.fullPath('out/syntax.json'), JSON.stringify(base))
}

module.exports = {
  mergeSyntax,
}
