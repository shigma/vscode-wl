import * as fs from 'fs'
import * as path from 'path'
import { vscPath } from '../utilities'
import * as extension from './extension'
import * as Textmate from 'vscode-textmate/release/main'
export * from 'vscode-textmate/release/main'

const textmate: typeof Textmate = require(vscPath('node_modules.asar/vscode-textmate'))

/** reload textmate grammars */
export function reload() {
  const grammars = extension.getResources('grammars', true)
  return new textmate.Registry({
    loadGrammar(scopeName: string) {
      const [grammar] = grammars.filter(g => g.scopeName === scopeName)
      if (!grammar) return
      const filepath = path.join(grammar.extensionPath, grammar.path)
      return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (error, data) => {
          if (error) reject(error)
          resolve(textmate.parseRawGrammar(data, filepath))
        })
      })
    }
  })
}
