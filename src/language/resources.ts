import * as vscode from 'vscode'

const systemSymbols: string[] = require('../resources/system')
const addonsSymbols: string[] = require('../resources/addons')
const usages: Record<string, string[]> = require('../resources/usages')
export const dictionary: Record<string, UsageItem> = {}

export const namespace: string[] = [
  ...systemSymbols,
  ...systemSymbols.map(name => 'System`' + name),
  ...addonsSymbols,
]

class UsageItem extends Array<vscode.MarkdownString> {
  readyForNextBlock = false
  documentation = new vscode.MarkdownString()

  constructor() {
    super(new vscode.MarkdownString())
  }

  append(...texts: string[]) {
    texts.forEach(text => {
      if (text.startsWith('code: ')) {
        if (this.readyForNextBlock) {
          this.push(new vscode.MarkdownString())
          this.readyForNextBlock = false
        }
        this.documentation.appendCodeblock(text.slice(6), 'wolfram')
        this[this.length - 1].appendCodeblock(text.slice(6), 'wolfram')
      } else {
        if (text.startsWith('text: ')) text = text.slice(6)
        this.documentation.appendMarkdown(text)
        this[this.length - 1].appendMarkdown(text)
        this.readyForNextBlock = true
      }
    })
  }
}

for (const name in usages) {
  const usage = new UsageItem()
  const context = name.match(/[\w`]+`/)
  if (context) usage.append(`From package: **${context[0]}**.\n\n`)
  usage.append(...usages[name])
  dictionary[name] = usage
}
