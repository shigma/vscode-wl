import * as vscode from 'vscode'
import { showMessage } from '../utilities/vsc-utils'

interface Replacement {
  start: number
  end: number
  code: number
}

function formatDocumentWithUTF8(editor: vscode.TextEditor) {
  const document = editor.document
  const replacements: Replacement[] = []
  let text = document.getText(), index = 0
  while (text.length) {
    const match = text.match(/(\\+)(:[\da-z]{4}|\.[\da-z]{2}|\d{3})/i)
    if (!match) break
    const start = index + match.index
    index = start + match[0].length
    text = text.slice(match.index + match[0].length)
    if (match[1].length % 2 === 0) continue
    replacements.push({
      start,
      end: index,
      code: match[2][0] === ':' || match[2][0] === '.'
        ? parseInt(match[2].slice(1), 16)
        : parseInt(match[2], 8),
    })
  }
  editor.edit(builder => {
    replacements.forEach(({ start, end, code }) => {
      if (code < 32) return
      const range = new vscode.Range(document.positionAt(start), document.positionAt(end))
      builder.replace(range, String.fromCharCode(code))
    })
  })
}

export function formatWithUTF8() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return
  if (editor.document.languageId !== 'wolfram') {
    showMessage('This file is probably not written in Wolfram Language, continue to format it into UTF-8?', () => {
      formatDocumentWithUTF8(editor)
    })
  } else {
    formatDocumentWithUTF8(editor)
  }
}
