import * as vscode from 'vscode'
import * as tm from './textmate'
import * as util from './utilities'

export interface ScopeToken {
  range: vscode.Range
  text: string
  scopes: string[]
}

export default class DocumentWatcher implements vscode.Disposable {
  /** stores the state for each line */
  private grammarState : tm.StackElement[] = []
  private subscriptions : vscode.Disposable[] = []

  public constructor(private document: vscode.TextDocument, private grammar: tm.IGrammar) {
    this.reparsePretties()
    this.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document == this.document) this.applyChanges(e.contentChanges)
    }))
  }

  public dispose() {
    this.subscriptions.forEach(s => s.dispose())
  }

  private refreshTokensOnLine(line: vscode.TextLine) : {tokens: tm.IToken[], invalidated: boolean} {
    if (!this.grammar) return {tokens: [], invalidated: false}
    const prevState = this.grammarState[line.lineNumber-1] || null
    const lineTokens = this.grammar.tokenizeLine(line.text, prevState)
    const invalidated = !this.grammarState[line.lineNumber] || !lineTokens.ruleStack.equals(this.grammarState[line.lineNumber])
    this.grammarState[line.lineNumber] = lineTokens.ruleStack
    return {tokens: lineTokens.tokens, invalidated: invalidated}
  }

  public getScopeAt(position: vscode.Position): ScopeToken {
    if (!this.grammar) return null
    position = this.document.validatePosition(position)
    const state = this.grammarState[position.line - 1] || null
    const line = this.document.lineAt(position.line)
    const tokens = this.grammar.tokenizeLine(line.text, state)
    for (let t of tokens.tokens) {
      if (t.startIndex <= position.character && position.character < t.endIndex)
        return {range: new vscode.Range(position.line,t.startIndex,position.line,t.endIndex), text: line.text.substring(t.startIndex,t.endIndex), scopes: t.scopes }
    }
    return null
  }

  private reparsePretties(range?: vscode.Range) : void {
    range = this.document.validateRange(range || new vscode.Range(0, 0, this.document.lineCount, 0))

    let invalidatedTokenState = false
    const lineCount = this.document.lineCount
    for (
      let lineIndex = range.start.line;
      lineIndex <= range.end.line || (invalidatedTokenState && lineIndex < lineCount);
      ++lineIndex
    ) {
      const line = this.document.lineAt(lineIndex)
      const { invalidated } = this.refreshTokensOnLine(line)
      invalidatedTokenState = invalidated
    }
  }

  private applyChanges(changes: vscode.TextDocumentContentChangeEvent[]) {
    changes = changes.sort((c1, c2) => c1.range.start.isAfter(c2.range.start) ? -1 : 1)
    for (const change of changes) {
      const delta = util.toRangeDelta(change.range, change.text)
      const editRange = util.rangeDeltaNewRange(delta)
      this.reparsePretties(editRange)
    }
  }

  public refresh() {
    this.grammarState = []
    this.reparsePretties()
  }
}
