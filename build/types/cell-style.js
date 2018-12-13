const all = require('./all').construct
const raw = require('./raw').construct

module.exports = {
  kind: 'mapping',
  construct({ target, contentName, patterns }) {
    return {
      begin: `^(\\(\\* *)::(${target})::(?:{{alnum}}+::)*( *\\*\\))(?=$)`,
      beginCaptures: raw({
        0: 'comment.line.cell.wolfram',
        1: 'punctualation.definition.comment.begin.wolfram',
        2: 'entity.name.section.cell-style.wolfram',
        3: 'punctualation.definition.comment.end.wolfram',
      }),
      end: '^(?!\\(\\*.+\\*\\)$)',
      contentName: 'meta.cell.wolfram',
      patterns: [{
        begin: '^\\(\\*',
        end: '\\*\\)$',
        beginCaptures: all('comment.line.cell.wolfram punctualation.definition.comment.begin.wolfram'),
        endCaptures: all('comment.line.cell.wolfram punctualation.definition.comment.end.wolfram'),
        contentName: contentName || (patterns ? undefined : 'comment.line.cell.wolfram'),
        patterns,
      }],
    }
  }
}
