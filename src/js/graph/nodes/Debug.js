import { readTextFile } from '@tauri-apps/plugin-fs'
import { createDebugWidget } from '../widgets/index.js'

export const Debug = {
  id: 'debug',
  title: 'Debug',
  resizableH: true,
  defaultHeight: 140,
  heightFollowsContent: false,
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
    const srcNode = conn?.fromSocket?.node
    if (typeof val === 'string' && srcNode?.nodeTypeId === 'load-file') {
      try {
        const content = await readTextFile(val)
        el.textContent = content
      } catch (err) {
        el.textContent = `[Error: ${err}]`
      }
    } else {
      if (typeof val === 'number' && srcNode?.inputDataType === 'float') {
        const decimals = srcNode.floatDecimals ?? 2
        el.textContent = val.toFixed(decimals)
      } else {
        el.textContent = String(val)
      }
    }
  }
}
