import { createIntegerWidget } from './IntegerWidget.js'
import { createDropdownWidget } from './DropdownWidget.js'

const OVERFLOW_ITEMS = [
  { value: 'hidden', label: 'hidden' },
  { value: 'scroll', label: 'scroll' },
  { value: 'auto', label: 'auto' }
]

export function createBodyWidget(node) {
  const wrap = document.createElement('div')
  wrap.className = 'widget-body'

  if (node.bodyBorderRadius === undefined) node.bodyBorderRadius = '0'
  if (node.bodyPadding === undefined) node.bodyPadding = '0'
  if (node.bodyOverflow === undefined) node.bodyOverflow = 'hidden'

  const trackEl = node.graph?.containerEl ?? null

  const sockets = {
    'border-radius': { key: 'bodyBorderRadius', socket: node.inputs.find(s => s.id === 'border-radius'), el: null },
    padding: { key: 'bodyPadding', socket: node.inputs.find(s => s.id === 'padding'), el: null }
  }

  // inject integer widgets into socket rows
  for (const entry of Object.values(sockets)) {
    if (!entry.socket?.rowEl) continue
    entry.el = createIntegerWidget(node, { valueKey: entry.key })
    entry.el.classList.add('widget-socket-int')
    entry.socket.rowEl.appendChild(entry.el)
  }

  // overflow dropdown in widget body
  const overflowRow = document.createElement('div')
  overflowRow.className = 'widget-div-overflow-row'
  const overflowLabel = document.createElement('span')
  overflowLabel.className = 'widget-div-overflow-label'
  overflowLabel.textContent = 'overflow'
  overflowRow.appendChild(overflowLabel)

  const overflowDropdown = createDropdownWidget({
    items: OVERFLOW_ITEMS,
    value: node.bodyOverflow,
    trackEl,
    onChange: (val) => {
      node.bodyOverflow = val
      node.graph?.save?.()
    }
  })
  overflowDropdown.classList.add('widget-div-overflow-dropdown')
  overflowRow.appendChild(overflowDropdown)
  wrap.appendChild(overflowRow)

  // hide widget when socket is connected
  function updateVisibility() {
    for (const entry of Object.values(sockets)) {
      if (!entry.el) continue
      const connected = entry.socket && entry.socket.connections.length > 0
      entry.el.style.display = connected ? 'none' : ''
    }
  }

  // hook into socket connect/disconnect
  for (const entry of Object.values(sockets)) {
    if (!entry.socket) continue
    const origAdd = entry.socket.addConnection.bind(entry.socket)
    const origRemove = entry.socket.removeConnection.bind(entry.socket)
    entry.socket.addConnection = (conn) => { origAdd(conn); updateVisibility() }
    entry.socket.removeConnection = (conn) => { origRemove(conn); updateVisibility() }
  }

  updateVisibility()
  return wrap
}
