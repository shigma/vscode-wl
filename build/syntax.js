const yaml = require('js-yaml')
const util = require('./util')
const fs = require('fs')

const syntax = yaml.safeLoad(fs.readFileSync(util.fullPath('source/wolfram.yaml')))

fs.writeFileSync(util.fullPath('syntaxes/wolfram.tmLanguage.json'), JSON.stringify(syntax))
