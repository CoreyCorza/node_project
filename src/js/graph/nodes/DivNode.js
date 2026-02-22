import { createDivWidget } from '../widgets/index.js'

export const DivNode = {
  id: 'div',
  title: 'Div',
  defaultWidth: 220,
  inputs: [
    { id: 'content', label: 'content', dataType: 'string' },
    { id: 'width', label: 'width', dataType: 'integer' },
    { id: 'height', label: 'height', dataType: 'integer' },
    { id: 'padding', label: 'padding', dataType: 'integer' }
  ],
  outputs: [{ id: 'html', label: 'html', dataType: 'string' }],
  compute: (inputs, node) => {
    const content = inputs.content ?? ''
    const w = inputs.width ?? (parseInt(node.divWidth, 10) || 0)
    const h = inputs.height ?? (parseInt(node.divHeight, 10) || 0)
    const p = inputs.padding ?? (parseInt(node.divPadding, 10) || 0)
    const styles = []
    if (w) styles.push(`width:${w}px`)
    if (h) styles.push(`height:${h}px`)
    if (p) styles.push(`padding:${p}px`)
    const styleAttr = styles.length ? ` style="${styles.join(';')}"` : ''
    const html = `<div${styleAttr}>${content}</div>`
    return { html }
  },
  createWidget: (node) => createDivWidget(node)
}
