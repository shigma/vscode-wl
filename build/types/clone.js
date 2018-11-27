module.exports = {
  kind: 'sequence', 
  construct: rules => (rules._clone = true, rules)
}
