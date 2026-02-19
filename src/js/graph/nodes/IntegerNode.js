import { createIntegerWidget } from '../widgets/index.js'

export const IntegerNode = {
  id: 'integer',
  title: 'Integer Node',
  inputs: [{ id: 'in', label: 'integer', dataType: 'integer' }],
  outputs: [{ id: 'out', label: 'integer', dataType: 'integer' }],
  compute: (inputs, node) => ({ out: inputs.in ?? (parseInt(node?.inputValue) || 0) }),
  createWidget: (node) => createIntegerWidget(node, { label: 'value', valueKey: 'inputValue' })
}
