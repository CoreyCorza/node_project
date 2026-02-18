import { readTextFile } from '@tauri-apps/plugin-fs'
import { createDebugWidget } from '../widgets/index.js'

export const Debug = {
  id: 'debug',
  title: 'Debug',
  inputs: [{ id: 'in', label: 'value', dataType: 'any' }],
  outputs: [],
  compute: () => ({}),
  createWidget: (node) => createDebugWidget(node),
  afterExecute: async function () {
    const el = this.debugDisplayEl
    if (!el) return
    const conn = this.inputs[0]?.connections[0]
    const val = conn?.fromSocket?.value
    if (val === undefined) {
      el.textContent = '(no value)'
      return
    }
    if (typeof val === 'string' && val.length > 0 && (val.includes('\\') || val.includes('/'))) {
      try {
        const content = await readTextFile(val)
        el.textContent = content
      } catch (err) {
        el.textContent = `[Error: ${err}]`
      }
    } else {
      el.textContent = String(val)
    }
  }
}
