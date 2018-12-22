import * as vscode from 'vscode'
import * as scopes from './scopes'
import * as language from './language'
import * as commands from './commands'

export function activate(context: vscode.ExtensionContext) {
  scopes.activate(context)
  language.activate(context)
  commands.activate(context)
}

export function deactivate() {
  scopes.deactivate()
}
