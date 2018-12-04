class MacroParser {
  constructor(variables = {}) {
    this.macros = []
    this.push(variables)
  }

  push(variables) {
    for (const key in variables) {
      this.macros.push({
        regex: new RegExp(`{{${key}}}`, 'g'),
        target: this.resolve(variables[key]),
      })
    }
    return this
  }

  resolve(source) {
    let output = source
    for (const macro of this.macros) {
      output = output.replace(macro.regex, macro.target)
    }
    return output
  }
}

module.exports = MacroParser
