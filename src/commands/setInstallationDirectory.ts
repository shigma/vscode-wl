import { exec } from 'child_process'
import * as vscode from 'vscode'

export default (config: vscode.WorkspaceConfiguration) => {
  function setInstallationDirectory(global?: boolean) {
    exec('wolframscript -c $InstallationDirectory', (error, stdout, stderr) => {
      if (error) throw error
      if (stderr) throw new Error(stderr)
      config.update('installationDirectory', stdout.trim(), global)
    })
  }

  if (!config.get('installationDirectory')) setInstallationDirectory(true)

  return setInstallationDirectory
}
