import { createDivWidget } from '../widgets/index.js'

export const DivNode = {
  id: 'div',
  title: 'Div',
  defaultWidth: 220,
  inputs: [
    { id: 'content', label: 'content', dataType: 'string' },
    { id: 'width', label: 'width', dataType: 'integer' },
    { id: 'height', label: 'height', dataType: 'integer' },
    { id: 'padding', label: 'padding', dataType: 'integer' },
    { id: 'background', label: 'background', dataType: 'string' },
    { id: 'border-radius', label: 'border-radius', dataType: 'integer' }
  ],
  outputs: [{ id: 'html', label: 'html', dataType: 'string' }],
  compute: (inputs, node) => {
    const content = inputs.content ?? ''
    const wMode = node.divWidthMode || ''
    const hMode = node.divHeightMode || ''
    const wRaw = inputs.width ?? (parseInt(node.divWidth, 10) || 0)
    const hRaw = inputs.height ?? (parseInt(node.divHeight, 10) || 0)
    const p = inputs.padding ?? (parseInt(node.divPadding, 10) || 0)
    const br = inputs['border-radius'] ?? (parseInt(node.divBorderRadius, 10) || 0)
    const bg = inputs.background ?? ''
    const overflow = node.divOverflow || 'hidden'
    const styles = []
    const wPct = parseInt(node.divWidthPercent, 10) || 0
    const hPct = parseInt(node.divHeightPercent, 10) || 0
    if (wMode === 'auto') styles.push('width:auto')
    else if (wMode === 'percent' && wPct) styles.push(`width:${wPct}%`)
    else if (wRaw) styles.push(`width:${wRaw}px`)
    if (hMode === 'auto') styles.push('height:auto')
    else if (hMode === 'percent' && hPct) styles.push(`height:${hPct}%`)
    else if (hRaw) styles.push(`height:${hRaw}px`)
    if (p) styles.push(`padding:${p}px`)
    if (br) styles.push(`border-radius:${br}px`)
    if (bg) styles.push(`background:${bg}`)
    if (overflow !== 'visible') styles.push(`overflow:${overflow}`)
    const styleAttr = styles.length ? ` style="${styles.join(';')}"` : ''
    const html = `<div${styleAttr}>${content}</div>`
    return { html }
  },
  createWidget: (node) => createDivWidget(node)
}
