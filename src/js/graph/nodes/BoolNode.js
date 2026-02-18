import { createBooleanWidget } from '../widgets/index.js'

export const BoolNode = {
  id: 'bool',
  title: 'Bool Node',
  inputs: [],
  outputs: [{ id: 'out', label: 'bool', dataType: 'bool' }],
  compute: (inputs, node) => ({ out: node?.booleanValue ?? false }),
  createWidget: (node) => createBooleanWidget(node, { label: 'value' })
}
