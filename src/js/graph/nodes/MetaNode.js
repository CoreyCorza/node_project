import { createMetaWidget } from '../widgets/index.js'

export const MetaNode = {
  id: 'meta',
  title: 'Meta',
  defaultWidth: 220,
  inputs: [
    { id: 'meta-in', label: 'meta-in', dataType: 'string' },
    { id: 'name', label: 'name', dataType: 'string' },
    { id: 'content', label: 'content', dataType: 'string' }
  ],
  outputs: [{ id: 'meta', label: 'meta', dataType: 'string' }],
  compute: (inputs, node) => {
    const metaName = node.metaName || 'viewport'
    let tag = ''

    switch (metaName) {
      case 'viewport':
        tag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        break
      case 'description':
      case 'author':
      case 'keywords': {
        const val = inputs.content ?? node.metaContent ?? ''
        if (val) tag = `<meta name="${metaName}" content="${val}">`
        break
      }
      case 'robots':
        tag = `<meta name="robots" content="${node.metaRobots || 'index, follow'}">`
        break
      case 'theme-color': {
        const color = inputs.content ?? ''
        if (color) tag = `<meta name="theme-color" content="${color}">`
        break
      }
      case 'custom': {
        const name = inputs.name ?? node.metaCustomName ?? ''
        const val = inputs.content ?? node.metaContent ?? ''
        if (name && val) tag = `<meta name="${name}" content="${val}">`
        break
      }
    }

    const prev = inputs['meta-in'] ?? ''
    if (!tag) return { meta: prev }
    return { meta: prev ? prev + '\n' + tag : tag }
  },
  createWidget: (node) => createMetaWidget(node)
}
