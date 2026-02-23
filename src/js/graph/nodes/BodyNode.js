import { createBodyWidget } from '../widgets/index.js'

export const BodyNode = {
  id: 'body',
  title: 'Body',
  defaultWidth: 220,
  inputs: [
    { id: 'content', label: 'content', dataType: 'string' },
    { id: 'background', label: 'background', dataType: 'string' },
    { id: 'border-radius', label: 'border-radius', dataType: 'integer' },
    { id: 'padding', label: 'padding', dataType: 'integer' }
  ],
  outputs: [{ id: 'html', label: 'html', dataType: 'string' }],
  compute: (inputs, node) => {
    const content = inputs.content ?? ''
    const bg = inputs.background ?? ''
    const br = inputs['border-radius'] ?? (parseInt(node.bodyBorderRadius, 10) || 0)
    const p = inputs.padding ?? (parseInt(node.bodyPadding, 10) || 0)
    const overflow = node.bodyOverflow || 'hidden'
    const styles = []
    if (bg) styles.push(`background:${bg}`)
    if (br) styles.push(`border-radius:${br}px`)
    if (p) styles.push(`padding:${p}px`)
    if (overflow !== 'visible') styles.push(`overflow:${overflow}`)
    const styleAttr = styles.length ? ` style="${styles.join(';')}"` : ''
    const parts = [`<body${styleAttr}>`]
    if (content) parts.push(...content.split('\n').map(l => '  ' + l))
    parts.push('</body>')
    return { html: parts.join('\n') }
  },
  createWidget: (node) => createBodyWidget(node)
}
