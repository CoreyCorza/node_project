import { createLoadFileWidget } from '../widgets/index.js'

export const LoadFile = {
  id: 'load-file',
  title: 'Load File',
  inputs: [],
  outputs: [{ id: 'path', label: 'path', dataType: 'string' }],
  compute: (inputs, node) => ({ path: node?.selectedFilePath ?? '' }),
  createWidget: (node) => createLoadFileWidget(node)
}
