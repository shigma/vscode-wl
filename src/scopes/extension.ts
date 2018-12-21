import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

interface ExtensionItem {
  extensionPath?: string
}

export interface Grammar {
  language?: string
  scopeName?: string
  path?: string
  injectTo?: string[]
  embeddedLanguages?: {
    [scopeName: string]: string
  }
}

export interface Language {
  id: string
  configuration: string
}

interface ContributeMap {
  languages: Language
  grammars: Grammar
}

type ContributeItem<K extends keyof ContributeMap> = (ContributeMap[K] & ExtensionItem)[]

export interface Extension extends vscode.Extension<any> {
  packageJSON: {
    contributes?: {
      [key in keyof ContributeMap]: ContributeMap[key][]
    }
  }
}

const contributes: { [K in keyof ContributeMap]?: ContributeItem<K> } = {}

export function getResources<K extends keyof ContributeMap>(key: K, forced = false) {
  if (!forced && key in contributes) return contributes[key]
  const resources: ContributeItem<K> = []
  for (const extension of vscode.extensions.all) {
    const { extensionPath, packageJSON } = extension as Extension
    if (!packageJSON || !packageJSON.contributes || !packageJSON.contributes[key]) continue
    resources.push(...(packageJSON.contributes[key] as ContributeMap[K][]).map(resource => {
      return Object.assign(resource, { extensionPath })
    }))
  }
  return (contributes[key] as ContributeItem<K>) = resources
}

export function getScopeForLanguage(languageId: string): string {
  const languages = getResources('grammars').filter(g => g.language === languageId)
  return languages[0] && languages[0].scopeName
}

export function getGrammar(scopeName: string) {
  const grammars = getResources('grammars', true).filter(g => g.scopeName === scopeName)
  if (!grammars.length) return
  const filepath = path.join(grammars[0].extensionPath, grammars[0].path)
  return fs.readFileSync(filepath, 'utf8')
}
