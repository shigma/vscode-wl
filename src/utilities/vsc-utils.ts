import * as vscode from 'vscode'

export function showMessage(message: string, callback?: () => void) {
  if (callback) {
    return vscode.window.showInformationMessage(message, 'Yes', 'No')
      .then(answer => answer === 'Yes' && callback())
  } else {
    return vscode.window.showInformationMessage(message)
  }
}

export function editorCommand(callback: (editor: vscode.TextEditor) => void) {
  return function() {
    const editor = vscode.window.activeTextEditor
    if (!editor) return
    if (editor.document.languageId !== 'wolfram') {
      showMessage('This file is probably not written in Wolfram Language.\nAre you sure you want to continue?', () => {
        callback(editor)
      })
    } else {
      callback(editor)
    }
  }
}
