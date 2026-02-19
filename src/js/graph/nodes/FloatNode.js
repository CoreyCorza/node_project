import { createFloatWidget } from '../widgets/index.js'

export const FloatNode = {
  id: 'float',
  title: 'Float Node',
  inputs: [{ id: 'in', label: 'float', dataType: 'float' }],
  outputs: [{ id: 'out', label: 'float', dataType: 'float' }],
  compute: (inputs, node) => ({ out: inputs.in ?? node?.floatValue ?? 0 }),
  createWidget: (node) => createFloatWidget(node, { label: 'value' })
}
