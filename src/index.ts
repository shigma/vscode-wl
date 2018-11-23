import * as vscode from 'vscode'

const WORD_PATTERN = /([$a-zA-Z]+[$0-9a-zA-Z]*`)*[$a-zA-Z]+[$0-9a-zA-Z]*/

const dictionary = require('../dist/usages')
const namespace = Object.keys(dictionary)

export function activate(context: vscode.ExtensionContext) {

	const builtinSymbolsProvider = vscode.languages.registerCompletionItemProvider('wolfram', {
		provideCompletionItems(document, position, token, context) {
			return namespace.map(name => {
				const completion = new vscode.CompletionItem(name)
				completion.documentation = new vscode.MarkdownString(dictionary[name])
				return completion
			})
		}
	})

	vscode.languages.registerHoverProvider('wolfram', {
		provideHover(document, position, token) {
			const word = document.getText(document.getWordRangeAtPosition(position, WORD_PATTERN))
			if (!(word in dictionary)) return
			return new vscode.Hover(dictionary[word])
		}
	})

	context.subscriptions.push(builtinSymbolsProvider)
}