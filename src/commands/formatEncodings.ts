import * as vscode from 'vscode'
import { editorCommand } from '../utilities/vsc-utils'

const characters = require('../resources/characters') as [number, string][]

interface Replacement {
  start: number
  end: number
  code: number
}

export const formatWithUTF8 = editorCommand(editor => {
  const document = editor.document
  const replacements: Replacement[] = []
  let text = document.getText(), end = 0

  while (text.length) {
    const match = text.match(/(\\+)(:[\da-fA-F]{4}|\.[\da-fA-F]{2}|\d{3}|\[\w+\])/)
    if (!match) break
    const start = end + match.index
    end = start + match[0].length
    text = text.slice(match.index + match[0].length)
    if (match[1].length % 2 === 0) continue

    let code: number
    switch (match[2][0]) {
      // named characters
      case '[': {
        const name = match[2].slice(1, -1)
        const item = characters.find(item => item[1] === name)
        if (!item) continue
        code = item[0]
        break
      }

      // hexidecimal unicode characters
      case ':':
      case '.':
        code = parseInt(match[2].slice(1), 16)
        break

      // octal unicode characters
      default:
        code = parseInt(match[2], 8)
    }

    replacements.push({ start, end, code })
  }

  editor.edit(builder => {
    replacements.forEach(({ start, end, code }) => {
      // control characters don't escape
      if (code <= 0x1f || code >= 0x7f && code <= 0x9f) return
      const range = new vscode.Range(document.positionAt(start), document.positionAt(end))
      builder.replace(range, String.fromCharCode(code))
    })
  })
})

export const formatWithASCII = editorCommand(editor => {
  const document = editor.document
  const config = vscode.workspace.getConfiguration()
  const useNamedCharacters = config.get('wolfram.formatter.namedCharacters')
  const extendedAsciiMethod = config.get('wolfram.formatter.extendedAscii')
  
  editor.edit(builder => {
    document.getText().split('').forEach((char, index) => {
      const code = char.charCodeAt(0)
      // basic ascii characters don't escape
      if (code <= 0x7f) return
      const range = new vscode.Range(document.positionAt(index), document.positionAt(index + 1))

      // use named characters if possible
      if (useNamedCharacters) {
        const item = characters.find(item => item[0] === code)
        if (item) {
          builder.replace(range, '\\[' + item[1] + ']')
          return
        }
      }

      // 4-digit hexidecimal for big unicode characters
      if (code > 0xff) {
        builder.replace(range, '\\:' + code.toString(16).padStart(4, '0'))
        return
      }

      // extended ascii characters
      switch (extendedAsciiMethod) {
        case '3-digit octal': return builder.replace(range, '\\' + code.toString(8))
        case '2-digit hexidecimal': return builder.replace(range, '\\.' + code.toString(16))
        case '4-digit hexidecimal': return builder.replace(range, '\\:00' + code.toString(16))
      }
    })
  })
})
