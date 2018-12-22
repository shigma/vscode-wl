import * as vscode from 'vscode'
import hoverProvider from './hover'
import colorProvider from './color'
import completionProvider from './completion'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('wolfram', hoverProvider),
    vscode.languages.registerColorProvider('wolfram', colorProvider),
    vscode.languages.registerCompletionItemProvider('wolfram', completionProvider),
  )
}
