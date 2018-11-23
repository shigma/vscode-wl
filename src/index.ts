import * as vscode from 'vscode'

const WORD_PATTERN = /([$a-zA-Z]+[$0-9a-zA-Z]*`)*[$a-zA-Z]+[$0-9a-zA-Z]*/

const dictionary = require('./usages')
const namespace = require('./namespace')

for (const name in dictionary) {
  const mdString = new vscode.MarkdownString()
  dictionary[name].forEach(({ type, content }) => {
    if (type === 'text') {
      mdString.appendMarkdown(content)
    } else {
      mdString.appendCodeblock(content, 'wolfram')
    }
  })
  dictionary[name] = mdString
}

export function activate(context: vscode.ExtensionContext) {

  const builtinSymbolsProvider = vscode.languages.registerCompletionItemProvider('wolfram', {
    provideCompletionItems(document, position, token, context) {
      return namespace.map(name => {
        const completion = new vscode.CompletionItem(name)
        completion.documentation = dictionary[name]
        return completion
      })
    }
  })

  vscode.languages.registerHoverProvider('wolfram', {
    provideHover(document, position, token) {
      let word = document.getText(document.getWordRangeAtPosition(position, WORD_PATTERN))
      if (word.startsWith('System`')) word = word.slice(7)
      if (!dictionary[word]) return
      return new vscode.Hover(dictionary[word])
    }
  })

  context.subscriptions.push(builtinSymbolsProvider)
}