import { vscPath } from '../utilities'
import * as Textmate from 'vscode-textmate/release/main'

export * from 'vscode-textmate/release/main'
export default require(vscPath('node_modules.asar/vscode-textmate')) as typeof Textmate
