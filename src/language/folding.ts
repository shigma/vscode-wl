import * as vscode from 'vscode'
import { getWatcher } from '../scopes'

export default {
  async provideFoldingRanges(document, context, token) {
    const watcher = await getWatcher(document)
    const result: vscode.FoldingRange[] = []
    const ranges = watcher.getRangeByRegex(/^\(\* ::([a-zA-Z\d]+::)+ \*\)(\r?\n\(\*.*\*\))+$/m)
    for (const range of ranges) {
      result.push(new vscode.FoldingRange(range.start.line, range.end.line, vscode.FoldingRangeKind.Region))
    }
    return result
  }
} as vscode.FoldingRangeProvider
