const path = require('path')
const fs = require('fs')

function fullPath(...filenames) {
  return path.resolve(__dirname, '..', ...filenames)
}

function vscPath(...filenames) {
  const match = process.env.PATH.match(/(;|^)[^;]+Microsoft VS Code\\bin(;|$)/g)
  if (!match) return
  return path.resolve(match[0].replace(/;/g, ''), '..', ...filenames)
}

function mkdir(...filenames) {
  const filepath = fullPath(...filenames)
  if (fs.existsSync(filepath)) return
  fs.mkdirSync(filepath) 
}

module.exports = {
  fullPath,
  vscPath,
  mkdir,
}
