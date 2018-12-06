import * as vscode from 'vscode'

const WORD_PATTERN = /([$a-zA-Z]+[$0-9a-zA-Z]*`)*[$a-zA-Z]+[$0-9a-zA-Z]*/

const systemSymbols: string[] = require('./resources/system')
const addonsSymbols: string[] = require('./resources/addons')
const dictionary = require('./resources/usages')

const namespace: string[] = [
  ...systemSymbols,
  ...systemSymbols.map(name => 'System`' + name),
  ...addonsSymbols,
]

for (const name in dictionary) {
  const mdString = new vscode.MarkdownString()
  const context = name.match(/[\w`]+`/)
  if (context) {
    mdString.appendMarkdown('From package: **' + context[0] + '**\n\n')
  }
  dictionary[name].forEach(block => {
    if (block.slice(0, 4) === 'text') {
      mdString.appendMarkdown(block.slice(6))
    } else {
      mdString.appendCodeblock(block.slice(6), 'wolfram')
    }
  })
  dictionary[name] = mdString
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

export const hoverProvider: vscode.HoverProvider = {
  provideHover(document, position, token) {
    let word = document.getText(document.getWordRangeAtPosition(position, WORD_PATTERN))
    if (word.startsWith('System`')) word = word.slice(7)
    if (!dictionary[word]) return
    return new vscode.Hover(dictionary[word])
  }
}
