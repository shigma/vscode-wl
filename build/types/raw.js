module.exports = {
  kind: 'mapping',
  construct(data) {
    const result = {}
    for (const key in data) {
      result[key] = typeof data[key] === 'string'
        ? data[key][0] === '#'
          ? { patterns: [{ include: data[key] }] }
          : { name: data[key] }
        : data[key]
    }
    return result
  }
}
