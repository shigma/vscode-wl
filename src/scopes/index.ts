import * as vscode from 'vscode'
import * as theme from './theme'
import * as workspace from './workspace'
import * as extension from './extension'
import { showError } from '../utilities/vsc-utils'

let activated = false
function wrapAPI<T extends (...args: any[]) => any>(callback: T) {
  return ((...args) => {
    try {
      if (!activated) throw new Error('API havn\'t been activated.')
      return callback(...args)
    } catch (error) {
      showError(error)
    }
  }) as T
}

export const getScopeAt = wrapAPI(workspace.getScopeAt)
export const getGrammar = wrapAPI(extension.getGrammar)
export const getScopeForLanguage = wrapAPI(extension.getScopeForLanguage)

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(d => workspace.open(d)),
    vscode.workspace.onDidCloseTextDocument(d => workspace.close(d)),
    vscode.workspace.onDidChangeConfiguration(() => theme.reload()),
  )

  theme.reload()
  workspace.reload()
  activated = true

  showError(JSON.stringify(theme.getTokenColor('variable.wolfram')))
}

export function deactivate() {
  activated = false
  workspace.unload()
}
