import * as vscode from 'vscode'
import { getWatcher } from '../../scopes'

const collection = vscode.languages.createDiagnosticCollection('wolfram.characters')

async function updateDiagnostics(document: vscode.TextDocument) {
  if (document.languageId !== 'wolfram') return
  const watcher = await getWatcher(document)
  collection.set(document.uri, [
    ...Array.from(watcher.getRangeByScope('invalid.character.encoding.wolfram')).map(range => {
      let message: string, code: string
      switch (document.getText(range)[1]) {
        case '.': message = 'Invalid encoded character: 2 hexadecimal digits are expected.'; code = '001'; break
        case ':': message = 'Invalid encoded character: 4 hexadecimal digits are expected.'; code = '002'; break
        default: message = 'Invalid encoded character: 3 octal digits are expected.'; code = '000'
      }
      return {
        code,
        range,
        message,
        source: 'wolfram',
        severity: vscode.DiagnosticSeverity.Error,
      }
    }),
    ...Array.from(watcher.getRangeByScope('invalid.character.built-in.wolfram')).map(range => ({
      code: '003',
      range,
      message: 'Invalid named character: cannot recognize character name.',
      source: 'wolfram',
      severity: vscode.DiagnosticSeverity.Error,
    })),
  ])
}

export const codeActionProvider: vscode.CodeActionProvider = {
  provideCodeActions(document, range, { diagnostics }, token) {
    const actions: vscode.CodeAction[] = []
    diagnostics.forEach(diagnostic => {
      const code = Number(diagnostic.code)
      if (code < 3) {
        const edit = new vscode.WorkspaceEdit()
        const range = diagnostic.range
        const text = document.getText(range).slice(1)
        const newText = code === 0
          ? '\\' + text.padStart(3, '0')
          : code === 1
            ? '\\.' + text.slice(1).padStart(2, '0')
            : '\\:' + text.slice(1).padStart(4, '0')
        edit.set(document.uri, [new vscode.TextEdit(range, newText)])
        actions.push({
          edit,
          title: `Do you mean "${newText}"?`,
          kind: vscode.CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
        })
      }
    })
    return actions
  }
}

export function activate(context: vscode.ExtensionContext) {
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document)
  }
  
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('wolfram', codeActionProvider),
    vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document)),
  )
}
