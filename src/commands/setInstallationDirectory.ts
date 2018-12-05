import { exec } from 'child_process'
import * as vscode from 'vscode'

export function setInstallationDirectory(global?: boolean) {
  const config = vscode.workspace.getConfiguration('wolfram')
  exec('wolframscript -c $InstallationDirectory', (error, stdout, stderr) => {
    if (error) throw error
    if (stderr) throw new Error(stderr)
    config.update('installationDirectory', stdout.trim(), global)
  })
}

const config = vscode.workspace.getConfiguration('wolfram')
if (!config.get('installationDirectory')) setInstallationDirectory(true)
