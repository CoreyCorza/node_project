import { createHeadWidget } from '../widgets/index.js'

export const HeadNode = {
  id: 'head',
  title: 'Head',
  defaultWidth: 220,
  resizableH: false,
  inputs: [
    { id: 'favicon', label: 'icon', dataType: 'string' },
    { id: 'meta', label: 'meta', dataType: 'string' }
  ],
  outputs: [{ id: 'html', label: 'html', dataType: 'string' }],
  compute: (inputs, node) => {
    const parts = ['<head>']

    // charset
    const charset = node.headCharset || 'UTF-8'
    parts.push(`  <meta charset="${charset}">`)

    // viewport
    if (node.headViewport !== false) {
      parts.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">')
    }

    // built-in meta tag
    const metaName = node.headMetaName || ''
    if (metaName === 'robots') {
      parts.push(`  <meta name="robots" content="${node.headMetaRobots || 'index, follow'}">`)
    } else if (metaName === 'description' || metaName === 'author' || metaName === 'keywords') {
      const val = node.headMetaContent || ''
      if (val) parts.push(`  <meta name="${metaName}" content="${val}">`)
    }

    // additional meta from chained Meta nodes
    const extraMeta = inputs.meta ?? ''
    if (extraMeta) parts.push('  ' + extraMeta.split('\n').join('\n  '))

    // theme color
    const color = node.headThemeColor || ''
    if (color) parts.push(`  <meta name="theme-color" content="${color}">`)

    // title
    const title = node.headTitle || ''
    if (title) parts.push(`  <title>${title}</title>`)

    // favicon
    const favicon = inputs.favicon ?? ''
    if (favicon) {
      const ext = favicon.split('.').pop().toLowerCase()
      const mimeTypes = { svg: 'image/svg+xml', ico: 'image/x-icon', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }
      const type = mimeTypes[ext] || 'image/x-icon'
      parts.push(`  <link rel="icon" type="${type}" href="${favicon}">`)
    }

    // open graph
    if (node.headOgEnabled) {
      if (title) parts.push(`  <meta property="og:title" content="${title}">`)
      const desc = node.headMetaName === 'description' ? (node.headMetaContent || '') : ''
      if (desc) parts.push(`  <meta property="og:description" content="${desc}">`)
    }

    parts.push('</head>')
    return { html: parts.join('\n') }
  },
  createWidget: (node) => createHeadWidget(node)
}
