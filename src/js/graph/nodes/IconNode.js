import { createIconWidget } from '../widgets/index.js'

export const IconNode = {
  id: 'icon',
  title: 'Icon',
  defaultWidth: 220,
  inputs: [],
  outputs: [{ id: 'path', label: 'path', dataType: 'string' }],
  compute: (inputs, node) => {
    return { path: node.iconFilePath ?? '' }
  },
  createWidget: (node) => createIconWidget(node)
}
