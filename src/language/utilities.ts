export const WORD_PATTERN = /([$a-zA-Z]+[$0-9a-zA-Z]*`)*[$a-zA-Z]+[$0-9a-zA-Z]*/

export function isIdentifierScope(scope: string) {
  return scope.startsWith('support.function')
    || scope.startsWith('support.undocumented')
    || scope.startsWith('variable.parameter')
    || scope.startsWith('constant')
    || scope === 'variable.other.wolfram'
    || scope === 'variable.other.context.wolfram'
}

export function identifierRegex(symbols: string[]) {
  return new RegExp(`(?<![0-9a-zA-Z$\`])(${symbols.join('|').replace(/\$/g, '\\$')})(?![0-9a-zA-Z$\`])`)
}
