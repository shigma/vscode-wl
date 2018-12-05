import * as vscode from 'vscode'
import { setInstallationDirectory } from './commands/setInstallationDirectory'
import { generateSyntaxFile, checkSyntaxFile } from './commands/generateSyntaxFile'
import { hoverProvider, completionProvider } from './language'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('wolfram', hoverProvider),
    vscode.languages.registerCompletionItemProvider('wolfram', completionProvider),
    vscode.workspace.onDidChangeConfiguration(checkSyntaxFile),
    vscode.commands.registerCommand('wolfram.generateSyntaxFile', generateSyntaxFile),
    vscode.commands.registerCommand('wolfram.setInstallationDirectory', setInstallationDirectory),
  )
}
