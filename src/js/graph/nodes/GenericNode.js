import { createInputWidget } from '../widgets/index.js'

export const InputNode = {
  id: 'input',
  title: 'Input',
  inputs: [],
  outputs: [{ id: 'out', label: 'value', dataType: 'string' }],
  compute: (inputs, node) => {
    const val = node?.inputValue ?? ''
    const type = node?.inputDataType ?? 'string'
    if (type === 'float') return { out: parseFloat(val) || 0 }
    if (type === 'integer') return { out: parseInt(val, 10) || 0 }
    if (type === 'bool') return { out: node?.booleanValue ?? false }
    return { out: val }
  },
  createWidget: (node) => createInputWidget(node)
}
