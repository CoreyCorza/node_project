import { createStringWidget } from '../widgets/index.js'

export const StringNode = {
  id: 'string',
  title: 'String Node',
  inputs: [{ id: 'in', label: 'string', dataType: 'string' }],
  outputs: [{ id: 'out', label: 'string', dataType: 'string' }],
  compute: (inputs, node) => ({ out: inputs.in ?? node?.stringValue ?? '' }),
  createWidget: (node) => createStringWidget(node, { label: 'value', valueKey: 'stringValue' })
}
