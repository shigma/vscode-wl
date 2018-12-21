import * as vscode from 'vscode'
import * as extension from './extension'
import * as textmate from './textmate'

interface ThemeItem {
  scope: string,
  settings: textmate.IRawThemeSetting["settings"]
}

let themes: ThemeItem[]

function* parseThemeData(theme: extension.ThemeData): IterableIterator<ThemeItem> {
  for (const { scope, settings } of theme.tokenColors) {
    if (!scope) continue
    const scopes = typeof scope === 'string' ? scope.split(/, */g) : scope
    for (const scope of scopes) {
      yield { scope, settings }
    }
  }
}

export function reload() {
  const label = vscode.workspace.getConfiguration().get('workbench.colorTheme') as string
  themes = Array.from(parseThemeData(extension.getTheme(label).data))
}

export function getTokenColor(...scopes: string[]) {
  for (const scope of scopes.reverse()) {
    const result = themes.find(t => scope.startsWith(t.scope))
    if (result) return result.settings
  }
}
