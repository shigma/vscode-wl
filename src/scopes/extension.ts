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
