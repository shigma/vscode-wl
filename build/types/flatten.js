function* flat(array) {
  for (let item of array) {
    if (Array.isArray(item)) {
      yield* flat(item)
    } else {
      yield item
    }
  }
}

function flatten(array) {
  const result = Array.from(flat(array)).map(rule => {
    if (rule.patterns) rule.patterns = flatten(rule.patterns)
    return rule
  })
  Object.keys(array).forEach(key => isNaN(key) && (result[key] = array[key]))
  return result
}

module.exports = {
  kind: 'sequence',
  construct: flatten,
}
