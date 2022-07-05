import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import * as textmate from './textmate'
import stripJsonComments from 'strip-json-comments'
import { vscRequire } from '../utilities'

// const stripJsonComments: typeof StripComments = vscRequire('strip-json-comments')

namespace Contributes {
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

  export interface Theme {
    label: string
    uiTheme: string
    path: string
  }
}

interface ContributeMap {
  languages: Contributes.Language
  grammars: Contributes.Grammar
  themes: Contributes.Theme
}

interface DataMap {
  languages: {}
  grammars: textmate.IRawGrammar
  themes: ThemeData
}

export interface ThemeData {
  name: string
  type: string
  colors: Record<string, string>
  tokenColors: textmate.IRawThemeSetting[]
}

type ContributeItem<K extends keyof ContributeMap> = (ContributeMap[K] & {
  extensionPath?: string
  data?: DataMap[K]
})

export type Language = ContributeItem<"languages">
export type Grammar = ContributeItem<"grammars">
export type Theme = ContributeItem<"themes">

export interface Extension extends vscode.Extension<any> {
  packageJSON: {
    contributes?: {
      [key in keyof ContributeMap]: ContributeMap[key][]
    }
  }
}

const contributes: { [K in keyof ContributeMap]?: ContributeItem<K>[] } = {}

export function getResources<K extends keyof ContributeMap>(key: K, forced = false) {
  if (!forced && key in contributes) return contributes[key]
  const resources: ContributeItem<K>[] = []
  for (const extension of vscode.extensions.all) {
    const { extensionPath, packageJSON } = extension as Extension
    if (!packageJSON || !packageJSON.contributes || !packageJSON.contributes[key]) continue
    resources.push(...(packageJSON.contributes[key] as ContributeMap[K][]).map(resource => {
      return Object.assign(resource, { extensionPath })
    }))
  }
  return (contributes[key] as ContributeItem<K>[]) = resources
}

export function getScopeForLanguage(languageId: string): string {
  const languages = getResources('grammars').filter(g => g.language === languageId)
  return languages[0] && languages[0].scopeName
}

export function getGrammar(scopeName: string) {
  const [grammar] = getResources('grammars').filter(g => g.scopeName === scopeName)
  if (!grammar) return
  const filepath = path.join(grammar.extensionPath, grammar.path)
  grammar.data = JSON.parse(stripJsonComments(fs.readFileSync(filepath, 'utf8')))
  return grammar
}

export function getTheme(label: string) {
  const [theme] = getResources('themes').filter(g => g.label === label)
  if (!theme) return
  const filepath = path.join(theme.extensionPath, theme.path)
  theme.data = JSON.parse(stripJsonComments(fs.readFileSync(filepath, 'utf8')))
  return theme
}
