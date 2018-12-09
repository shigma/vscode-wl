import * as vscode from 'vscode'
import { setInstallationDirectory } from './commands/setInstallationDirectory'
import { generateSyntax, checkSyntax } from './commands/generateSyntax'
import { hoverProvider, completionProvider } from './language'
import { formatWithUTF8 } from './commands/formatWithUTF8'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('wolfram', hoverProvider),
    vscode.languages.registerCompletionItemProvider('wolfram', completionProvider),
    vscode.workspace.onDidChangeConfiguration(checkSyntax),
    vscode.commands.registerCommand('wolfram.formatWithUTF8', formatWithUTF8),
    vscode.commands.registerCommand('wolfram.generateSyntax', generateSyntax),
    vscode.commands.registerCommand('wolfram.setInstallationDirectory', setInstallationDirectory),
  )
}
