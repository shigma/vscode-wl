module.exports = {
  kind: 'scalar',
  construct(source) {
    return `(?<![0-9a-zA-Z$\`])(?:System\`)?({{${source}}})(?![0-9a-zA-Z$\`])`
  }
}
