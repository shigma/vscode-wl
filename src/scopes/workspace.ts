import * as vscode from 'vscode'
import * as textmate from './textmate'
import DocumentWatcher from './document'
import { getScopeForLanguage } from './extension'

let registry: textmate.Registry
let target = null
export const documents = new Map<vscode.Uri, DocumentWatcher>()

export function filter(languages: string[] | null) {
  target = languages
  vscode.workspace.textDocuments.forEach(d => open(d, false))
}

export async function open(document: vscode.TextDocument, refresh = true) {
  const { uri, languageId } = document
  const watcher = documents.get(uri)
  const valid = target ? target.includes(languageId) : true
  if (watcher) {
    if (valid) {
      if (refresh) watcher.refresh()
    } else {
      watcher.dispose()
      documents.delete(uri)
    }
  } else {
    if (!valid) return
    const scopeName = getScopeForLanguage(languageId)
    if (!scopeName) return
    if (!registry) throw new Error('No textmate registry.')
    const grammar = await registry.loadGrammar(scopeName)
    const watcher = new DocumentWatcher(document, grammar)
    documents.set(uri, watcher)
    return watcher
  }
}

export function close(document: vscode.TextDocument) {
  const watcher = documents.get(document.uri)
  if (!watcher) return
  watcher.dispose()
  documents.delete(document.uri)
}

export function unload() {
  for (const watcher of documents.values()) {
    watcher.dispose()
  }
  documents.clear()
}

export function reload() {
  registry = textmate.reload()
  unload()
  vscode.workspace.textDocuments.forEach(d => open(d))
}

function wrapAPI<T extends (watcher: DocumentWatcher, ...args: any[]) => any>(callback: T) {
  return async (
    document: vscode.TextDocument,
    ...args: (T extends (watcher: DocumentWatcher, ...args: infer R) => any ? R : any)
  ) => {
    const watcher = documents.get(document.uri) || await open(document)
    return callback(watcher, ...args) as ReturnType<T>
  }
}

export async function getWatcher(document: vscode.TextDocument) {
  return documents.get(document.uri) || await open(document)
}
