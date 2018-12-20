import * as vscode from 'vscode'
import * as textmate from './textmate'
import * as extension from './extension'
import DocumentWatcher from './document'
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

let registry: textmate.Registry
let documents = new class DocumentMap extends Map<vscode.Uri, DocumentWatcher> {
  constructor(private _languages: string[] = null){
    super()
  }

  filter(languages: string[] | null) {
    this._languages = languages
    vscode.workspace.textDocuments.forEach(d => this.open(d, false))
  }

  async open(document: vscode.TextDocument, refresh = true) {
    const { uri, languageId } = document
    const watcher = this.get(uri)
    const valid = this._languages ? this._languages.includes(languageId) : true
    if (watcher) {
      if (valid) {
        if (refresh) watcher.refresh()
      } else {
        watcher.dispose()
        this.delete(uri)
      }
    } else {
      if (!valid) return
      const scopeName = getScopeForLanguage(languageId)
      if (!scopeName) return
      if (!registry) throw new Error('No textmate registry.')
      const grammar = await registry.loadGrammar(scopeName)
      this.set(uri, new DocumentWatcher(document, grammar))
    }
  }

  close(document: vscode.TextDocument) {
    const watcher = this.get(document.uri)
    if (!watcher) return
    watcher.dispose()
    this.delete(document.uri)
  }

  unload() {
    for (const watcher of this.values()) {
      watcher.dispose()
    }
    this.clear()
  }
}(['wolfram'])

export function getScopeForLanguage(languageId: string): string {
  const languages = extension.getResources('grammars').filter(g => g.language === languageId)
  return languages[0] && languages[0].scopeName
}

export const getScopeAt = wrapAPI((document: vscode.TextDocument, position: vscode.Position) => {
  const watcher = documents.get(document.uri)
  if (!watcher) return
  return watcher.getScopeAt(position)
})

export const getGrammar = wrapAPI((scopeName: string) => {
  return registry.loadGrammar(scopeName)
})

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(d => documents.open(d)))
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(d => documents.close(d)))
  reload()
  activated = true
}

export function reload() {
  registry = textmate.reload()
  documents.unload()
  vscode.workspace.textDocuments.forEach(d => documents.open(d))
}

export function deactivate() {
  activated = false
  documents.unload()
}
