import * as vscode from 'vscode'
import { namespace, dictionary } from './resources'

export default {
  provideCompletionItems(document, position, token, context) {
    return namespace.map(name => {
      const completion = new vscode.CompletionItem(name)
      if (name.startsWith('System`')) name = name.slice(7)
      completion.documentation = dictionary[name].documentation
      return completion
    })
  }
} as vscode.CompletionItemProvider
