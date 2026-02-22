import { createIntegerWidget } from './IntegerWidget.js'

export function createDivWidget(node) {
  const wrap = document.createElement('div')
  wrap.className = 'widget-div'

  // initialise defaults
  if (node.divWidth === undefined) node.divWidth = '0'
  if (node.divHeight === undefined) node.divHeight = '0'
  if (node.divPadding === undefined) node.divPadding = '0'

  const sockets = {
    width: { key: 'divWidth', socket: node.inputs.find(s => s.id === 'width'), el: null },
    height: { key: 'divHeight', socket: node.inputs.find(s => s.id === 'height'), el: null },
    padding: { key: 'divPadding', socket: node.inputs.find(s => s.id === 'padding'), el: null }
  }

  // inject integer widgets into each socket row
  for (const entry of Object.values(sockets)) {
    if (!entry.socket?.rowEl) continue
    entry.el = createIntegerWidget(node, { valueKey: entry.key })
    entry.el.classList.add('widget-socket-int')
    entry.socket.rowEl.appendChild(entry.el)
  }

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
