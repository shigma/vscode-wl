module.exports = {
  kind: 'scalar', 
  construct: source => [{ include: '#' + source }]
}
