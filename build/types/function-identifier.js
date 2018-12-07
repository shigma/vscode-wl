module.exports = {
  kind: 'scalar',
  construct(tag) {
    return tag === 'simplest' ? {
      patterns: [
        { include: '#function-identifier' },
      ]
    } : {
      patterns: [
        { include: '#undocumented-function' },
        { include: '#variable-basic' },
        { include: '#function-identifier' },
      ],
    }
  }
}
