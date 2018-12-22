import * as vscode from 'vscode'
import * as utils from './utilities'
import { getWatcher } from '../scopes'
import { dictionary } from './resources'

export default  {
  async provideHover(document, position, token) {
    const watcher = await getWatcher(document)
    const scopeToken = watcher.getScopeAt(position)
    if (scopeToken && !utils.isIdentifierScope(scopeToken.scopes[scopeToken.scopes.length - 1])) return
    const range = document.getWordRangeAtPosition(position, utils.WORD_PATTERN)
    let word = document.getText(range)
    if (word.startsWith('System`')) word = word.slice(7)
    if (!dictionary[word]) return
    return new vscode.Hover(dictionary[word], range)
  }
} as vscode.HoverProvider
