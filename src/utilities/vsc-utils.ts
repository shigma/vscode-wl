import * as vscode from 'vscode'

export function showMessage(message: string, callback?: () => any) {
  if (callback) {
    return vscode.window.showInformationMessage(message, 'Yes', 'No')
      .then(answer => answer === 'Yes' && callback())
  } else {
    return vscode.window.showInformationMessage(message)
  }
}
