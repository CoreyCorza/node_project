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
      console.info(`[Debug] ${this.title}: (no value)`)
      return
    }
    const srcNode = conn?.fromSocket?.node
    let displayText
    if (typeof val === 'string' && srcNode?.nodeTypeId === 'load-file') {
      try {
        displayText = await readTextFile(val)
      } catch (err) {
        displayText = `[Error: ${err}]`
      }
    } else if (typeof val === 'number' && srcNode?.inputDataType === 'float') {
      const decimals = srcNode.floatDecimals ?? 2
      displayText = val.toFixed(decimals)
    } else {
      displayText = String(val)
    }
    el.textContent = displayText
    console.info(`[Debug] ${this.title}: ${displayText}`)
  }
}
