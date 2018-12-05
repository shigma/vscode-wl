import * as cp from 'child_process'
import * as path from 'path'

export function fullPath(...filenames: string[]) {
  return path.resolve(__dirname, '../..', ...filenames)
}

export function executeWolfram(
  script: string,
  callback: (error: cp.ExecException, stdout: string, stderr: string) => void
) {
  return cp.exec(`wolframscript -c "${script.replace(/"/g, '\\"')}"`, callback)
}
