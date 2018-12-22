import * as vscode from 'vscode'
import { getWatcher } from '../scopes'

const colorMap = {
  Red: new vscode.Color(1, 0, 0, 1),
  Green: new vscode.Color(0, 1, 0, 1),
  Blue: new vscode.Color(0, 0, 1, 1),
  Black: new vscode.Color(0, 0, 0, 1),
  White: new vscode.Color(1, 1, 1, 1),
  Gray: new vscode.Color(.5, .5, .5, 1),
  Cyan: new vscode.Color(0, 1, 1, 1),
  Magenta: new vscode.Color(1, 0, 1, 1),
  Yellow: new vscode.Color(1, 1, 0, 1),
  Orange: new vscode.Color(1, .5, 0, 1),
  Pink: new vscode.Color(1, .5, .5, 1),
  Purple: new vscode.Color(.5, 0, .5, 1),
  Brown: new vscode.Color(.6, .4, .2, 1),
  LightRed: new vscode.Color(1, .85, .85, 1),
  LightGreen: new vscode.Color(.85, 1, .85, 1),
  LightBlue: new vscode.Color(.85, .85, 1, 1),
  LightGray: new vscode.Color(.85, .85, .85, 1),
  LightCyan: new vscode.Color(.9, 1, 1, 1),
  LightMagenta: new vscode.Color(1, .9, 1, 1),
  LightYellow: new vscode.Color(1, 1, .9, 1),
  LightOrange: new vscode.Color(1, .9, .8, 1),
  LightPink: new vscode.Color(1, .925, .925, 1),
  LightPurple: new vscode.Color(.94, 0.88, .94, 1),
  LightBrown: new vscode.Color(.94, .91, .88, 1),
  Transparent: new vscode.Color(0, 0, 0, 0),
} as Record<string, vscode.Color>

export default {
  provideColorPresentations(color, { document, range }, token) {
    return null
  },
  async provideDocumentColors(document, token) {
    const result: vscode.ColorInformation[] = []
    const watcher = await getWatcher(document)
    for (const range of watcher.getRangeByScope('constant.language.wolfram')) {
      const color = colorMap[document.getText(range)]
      if (color) result.push({ range, color })
    }
    return result
  },
} as vscode.DocumentColorProvider
