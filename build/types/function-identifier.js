module.exports = {
  kind: 'scalar',
  construct() {
    return {
      name: 'entity.name.function.wolfram',
      patterns: [{ include: '#function-identifier' }],
    }
  }
}
