type Variables = Record<string, string>

interface MacroItem {
  regex: RegExp
  target: string
}

export default class MacroParser {
  macros: MacroItem[]

  constructor(variables: Variables = {}) {
    this.macros = []
    this.push(variables)
  }

  push(variables: Variables): this {
    for (const key in variables) {
      this.macros.push({
        regex: new RegExp(`{{${key}}}`, 'g'),
        target: this.resolve(variables[key]),
      })
    }
    return this
  }

  resolve(source: string): string {
    let output = source
    for (const macro of this.macros) {
      output = output.replace(macro.regex, macro.target)
    }
    return output
  }

  clone(variables: Variables = {}): MacroParser {
    const parser = new MacroParser()
    parser.macros = this.macros.slice()
    return parser.push(variables)
  }
}
