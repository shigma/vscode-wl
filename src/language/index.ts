import * as vscode from 'vscode'
import { getScopeAt } from '../scopes'

const WORD_PATTERN = /([$a-zA-Z]+[$0-9a-zA-Z]*`)*[$a-zA-Z]+[$0-9a-zA-Z]*/

const systemSymbols: string[] = require('../resources/system')
const addonsSymbols: string[] = require('../resources/addons')
const dictionary = require('../resources/usages')

const namespace: string[] = [
  ...systemSymbols,
  ...systemSymbols.map(name => 'System`' + name),
  ...addonsSymbols,
]

class UsageItem extends Array<vscode.MarkdownString> {
  readyForNextBlock = false
  
  constructor() {
    super(new vscode.MarkdownString())
  }

  append(...texts: string[]) {
    texts.forEach(text => {
      if (text.startsWith('code: ')) {
        if (this.readyForNextBlock) {
          this.push(new vscode.MarkdownString())
          this.readyForNextBlock = false
        }
        this[this.length - 1].appendCodeblock(text.slice(6), 'wolfram')
      } else {
        if (text.startsWith('text: ')) text = text.slice(6)
        this[this.length - 1].appendMarkdown(text)
        this.readyForNextBlock = true
      }
    })
  }
}

for (const name in dictionary) {
  const usage = new UsageItem()
  const context = name.match(/[\w`]+`/)
  if (context) usage.append(`From package: **${context[0]}**.\n\n`)
  usage.append(...dictionary[name])
  dictionary[name] = usage
}

export const completionProvider: vscode.CompletionItemProvider = {
  provideCompletionItems(document, position, token, context) {
    return namespace.map(name => {
      const completion = new vscode.CompletionItem(name)
      if (name.startsWith('System`')) name = name.slice(7)
      completion.documentation = dictionary[name]
      return completion
    })
  }
}

function isIdentifierScope(scope: string) {
  return scope.startsWith('support.function')
    || scope.startsWith('support.undocumented')
    || scope.startsWith('variable.parameter')
    || scope.startsWith('constant')
    || scope === 'variable.other.wolfram'
    || scope === 'variable.other.context.wolfram'
}

export const hoverProvider: vscode.HoverProvider = {
  provideHover(document, position, token) {
    const scopeToken = getScopeAt(document, position)
    if (!scopeToken) return
    if (!isIdentifierScope(scopeToken.scopes[scopeToken.scopes.length - 1])) return
    const range = document.getWordRangeAtPosition(position, WORD_PATTERN)
    let word = document.getText(range)
    if (word.startsWith('System`')) word = word.slice(7)
    if (!dictionary[word]) return
    return new vscode.Hover(dictionary[word], range)
  }
}
