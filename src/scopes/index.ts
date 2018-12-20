import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import textmate, * as tm from './textmate'
import DocumentWatcher from './document'
import { showMessage, showError } from '../utilities/vsc-utils'
import * as extension from './extension'

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

let textMateRegistry: tm.Registry
let documents = new class DocumentMap extends Map<vscode.Uri, DocumentWatcher> {
  async open(document: vscode.TextDocument) {
    try {
      const watcher = this.get(document.uri)
      if (watcher) {
        watcher.refresh()
      } else if (textMateRegistry) {
        const scopeName = getScopeForLanguage(document.languageId)
        if (!scopeName) return
        const grammar = await textMateRegistry.loadGrammar(scopeName)
        this.set(document.uri, new DocumentWatcher(document, grammar))
      } else {
        throw new Error('No textmate registry.')
      }
    } catch (err) {
      showError(err)
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
}()

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
  return textMateRegistry.loadGrammar(scopeName)
})

export default function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(d => documents.open(d)))
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(d => documents.close(d)))

  reloadGrammar()
}

/** Re-read the settings and recreate substitutions for all documents */
function reloadGrammar() {
  textMateRegistry = new textmate.Registry({
    loadGrammar(scopeName: string) {
      const [grammar] = extension.getResources('grammars', true).filter(g => g.scopeName === scopeName)
      if (!grammar) return
      const filepath = path.join(grammar.extensionPath, grammar.path)
      showMessage(`Scope-info: found grammar for ${scopeName} at ${filepath}`)
      return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (error, data) => {
          if (error) reject(error)
          resolve(tm.parseRawGrammar(data, filepath))
        })
      })
    }
  })

  documents.unload()
  vscode.workspace.textDocuments.forEach(d => documents.open(d))
}

export function deactivate() {
  documents.unload()
}
