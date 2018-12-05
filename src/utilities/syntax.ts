import * as fs from 'fs'
import * as utils from '.'

export function mergeSyntax(base, ...syntaxes) {
  base._plugins = []
  syntaxes.forEach(syntax => {
    base._plugins.push(syntax._name)
    for (const key in syntax.repository) {
      if (key in base.repository) {
        const basePatterns = base.repository[key].patterns
        if (!basePatterns) return
        const index = basePatterns.findIndex(rule => rule === '__SLOT__')
        if (index !== -1) basePatterns.splice(index, 1, ...(syntax.repository[key].patterns || []))
      } else {
        base.repository[key] = syntax.repository[key]
      }
    }
  })

  for (const key in base.repository) {
    const basePatterns = base.repository[key].patterns
    if (!basePatterns) continue
    base.repository[key].patterns = basePatterns.filter(rule => typeof rule !== 'string')
  }

  fs.writeFileSync(utils.fullPath('out/syntax.json'), JSON.stringify(base))
}
