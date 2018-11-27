module.exports = {
  kind: 'sequence',
  construct(patterns) {
    return [{
      begin: ',',
      end: '(?=[,\\]])',
      captures: { 0: { name: 'punctuation.separator.sequence.wolfram' } },
      patterns,
    }, {
      include: '#expressions'
    }]
  }
}
