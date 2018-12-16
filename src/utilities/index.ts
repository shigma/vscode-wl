import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

export function fullPath(...filenames: string[]) {
  return path.resolve(__dirname, '../..', ...filenames)
}

export function vscPath(...filenames: string[]) {
  const match = process.env.PATH.match(/(;|^)[^;]+Microsoft VS Code\\bin(;|$)/g)
  if (!match) return
  return path.resolve(match[0].replace(/;/g, ''), '..', ...filenames)
}

export function mkdir(...filenames: string[]) {
  const filepath = fullPath(...filenames)
  if (fs.existsSync(filepath)) return
  fs.mkdirSync(filepath) 
}

type executeCallback = (error: cp.ExecException, stdout: string, stderr: string) => void

function wrapScript(script: string) {
  return '"' + script.replace(/"/g, '\\"') + '"'
}

export function executeCode(script: string, callback: executeCallback) {
  return cp.exec(`wolframscript -c ${wrapScript(script)}`, callback)
}

export function executeFile(filename: string, args: string[], callback: executeCallback) {
  return cp.exec(`wolframscript -f "${fullPath(filename)}" ` + args.map(wrapScript).join(' '), callback)
}
