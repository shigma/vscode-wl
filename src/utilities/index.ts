import * as cp from 'child_process'
import * as path from 'path'

export function fullPath(...filenames: string[]) {
  return path.resolve(__dirname, '../..', ...filenames)
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
