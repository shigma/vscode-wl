module.exports = {
  kind: 'scalar',
  construct() {
    return {
      patterns: [{ include: '#function-identifier' }],
    }
  }
}
