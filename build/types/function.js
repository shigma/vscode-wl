module.exports = {
  kind: 'mapping',
  construct({ target, context, type, identifier }) {
    return {
      begin: `(${target})\\s*(\\[(?!\\[))`,
      beginCaptures: {
        1: identifier ||
          { name: `${ type ? 'support.function.' + type : 'entity.name.function' }.wolfram` },
        2: { name: 'meta.block.wolfram punctuation.section.brackets.begin.wolfram' },
      },
      end: '\\]',
      endCaptures: {
        0: { name: 'meta.block.wolfram punctuation.section.brackets.end.wolfram' },
      },
      contentName: 'meta.block.wolfram',
      patterns: context || [{ include: '#expressions' }],
    }
  }
}
