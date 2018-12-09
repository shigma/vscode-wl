import * as cp from 'child_process'
import * as path from 'path'
import * as vscode from 'vscode'

export function showMessage(message: string, callback?: () => any) {
  if (callback) {
    return vscode.window.showInformationMessage(message, 'Yes', 'No')
      .then(answer => answer === 'Yes' && callback())
  } else {
    return vscode.window.showInformationMessage(message)
  }
}

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
