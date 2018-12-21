import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

export function fullPath(...filenames: string[]) {
  return path.resolve(__dirname, '../..', ...filenames)
}

export function vscPath(...filenames: string[]) {
  let basePath: string
  if (process.argv0.endsWith(path.join('Microsoft VS Code', 'Code.exe'))) {
    basePath = path.join(require.main.filename, '../../../..')
  } else {
    let paths = process.env.PATH.match(/(;|^)[^;]+Microsoft VS Code[\\/]bin(;|$)/g)
    if (!paths) return
    paths = paths.map(str => str.replace(/;/g, ''))
    basePath = paths.find(str => str.startsWith(process.env.LOCALAPPDATA)) || paths[0]
  }
  return path.resolve(basePath, 'resources/app', ...filenames)
}

export function vscRequire(filename: string) {
  return require(vscPath('node_modules.asar', filename))
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
