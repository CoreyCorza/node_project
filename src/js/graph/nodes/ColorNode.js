import { createColorWidget } from '../widgets/index.js'

export const ColorNode = {
  id: 'color',
  title: 'Color',
  inputs: [],
  outputs: [{ id: 'hex', label: 'hex', dataType: 'string' }],
  compute: (inputs, node) => {
    return { hex: node.colorValue ?? '#000000' }
  },
  createWidget: (node) => createColorWidget(node)
}
