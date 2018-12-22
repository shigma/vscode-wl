import * as vscode from 'vscode'

import hoverProvider from './hover'
import colorProvider from './color'
import foldingProvider from './folding'
import completionProvider from './completion'

import * as character from './features/character'

export function activate(context: vscode.ExtensionContext) {
  character.activate(context)
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('wolfram', hoverProvider),
    vscode.languages.registerColorProvider('wolfram', colorProvider),
    vscode.languages.registerFoldingRangeProvider('wolfram', foldingProvider),
    vscode.languages.registerCompletionItemProvider('wolfram', completionProvider),
  )
}
