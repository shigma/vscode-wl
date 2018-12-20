import * as vscode from 'vscode'
import * as scopes from './scopes'
import { hoverProvider, completionProvider } from './language'
import { generateSyntax, checkSyntax } from './commands/generateSyntax'
import { formatWithUTF8, formatWithASCII } from './commands/formatEncodings'
import { setInstallationDirectory } from './commands/setInstallationDirectory'

export function activate(context: vscode.ExtensionContext) {
  scopes.activate(context)
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('wolfram', hoverProvider),
    vscode.languages.registerCompletionItemProvider('wolfram', completionProvider),
    vscode.workspace.onDidChangeConfiguration(checkSyntax),
    vscode.commands.registerCommand('wolfram.formatWithUTF8', formatWithUTF8),
    vscode.commands.registerCommand('wolfram.formatWithASCII', formatWithASCII),
    vscode.commands.registerCommand('wolfram.generateSyntax', generateSyntax),
    vscode.commands.registerCommand('wolfram.setInstallationDirectory', setInstallationDirectory),
  )
}

export function deactivate() {
  scopes.deactivate()
}
