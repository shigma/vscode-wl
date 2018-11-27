module.exports = {
  kind: 'scalar',
  construct(str) {
    return str.split(/\r?\n/g).map(str => str.replace(/(#.*)?$/, '').trim()).join('')
  }
}
