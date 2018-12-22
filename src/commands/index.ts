import * as vscode from 'vscode'
import { generateSyntax, checkSyntax } from './generateSyntax'
import { formatWithUTF8, formatWithASCII } from './formatEncodings'
import { setInstallationDirectory } from './setInstallationDirectory'

export function activate(context: vscode.ExtensionContext) {
  function registerCommand(command: string, callback: (...args: any[]) => any) {
    context.subscriptions.push(vscode.commands.registerCommand(command, callback))
  }

  registerCommand('wolfram.formatWithUTF8', formatWithUTF8)
  registerCommand('wolfram.formatWithASCII', formatWithASCII)
  registerCommand('wolfram.generateSyntax', generateSyntax)
  registerCommand('wolfram.setInstallationDirectory', setInstallationDirectory)

  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(checkSyntax))
}
