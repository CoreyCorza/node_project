import { createIntegerWidget } from './IntegerWidget.js'
import { createDropdownWidget } from './DropdownWidget.js'

const OVERFLOW_ITEMS = [
  { value: 'hidden', label: 'hidden' },
  { value: 'scroll', label: 'scroll' },
  { value: 'auto', label: 'auto' }
]

export function createDivWidget(node) {
  const wrap = document.createElement('div')
  wrap.className = 'widget-div'

  // initialise defaults
  if (node.divWidth === undefined) node.divWidth = '0'
  if (node.divHeight === undefined) node.divHeight = '0'
  if (node.divPadding === undefined) node.divPadding = '0'
  if (node.divBorderRadius === undefined) node.divBorderRadius = '0'
  if (node.divOverflow === undefined) node.divOverflow = 'hidden'
  if (node.divWidthMode === undefined) node.divWidthMode = ''
  if (node.divHeightMode === undefined) node.divHeightMode = ''
  if (node.divWidthPercent === undefined) node.divWidthPercent = '100'
  if (node.divHeightPercent === undefined) node.divHeightPercent = '100'

  const trackEl = node.graph?.containerEl ?? null

  const sockets = {
    width: { key: 'divWidth', socket: node.inputs.find(s => s.id === 'width'), el: null },
    height: { key: 'divHeight', socket: node.inputs.find(s => s.id === 'height'), el: null },
    padding: { key: 'divPadding', socket: node.inputs.find(s => s.id === 'padding'), el: null },
    'border-radius': { key: 'divBorderRadius', socket: node.inputs.find(s => s.id === 'border-radius'), el: null }
  }

  // inject integer widgets into each socket row
  for (const entry of Object.values(sockets)) {
    if (!entry.socket?.rowEl) continue
    entry.el = createIntegerWidget(node, { valueKey: entry.key })
    entry.el.classList.add('widget-socket-int')
    entry.socket.rowEl.appendChild(entry.el)
  }

  // auto/% checkboxes + percent input for width and height
  const modeControls = {}
  for (const [dim, modeKey, pctKey] of [
    ['width', 'divWidthMode', 'divWidthPercent'],
    ['height', 'divHeightMode', 'divHeightPercent']
  ]) {
    const socket = sockets[dim]
    if (!socket?.socket?.rowEl) continue

    const modeWrap = document.createElement('div')
    modeWrap.className = 'widget-dim-mode'
    modeWrap.addEventListener('mousedown', (e) => e.stopPropagation())
    modeWrap.addEventListener('pointerdown', (e) => e.stopPropagation())

    const autoCheck = document.createElement('input')
    autoCheck.type = 'checkbox'
    autoCheck.className = 'widget-dim-check'
    autoCheck.checked = node[modeKey] === 'auto'
    const autoLabel = document.createElement('label')
    autoLabel.className = 'widget-dim-check-label'
    autoLabel.textContent = 'auto'
    autoLabel.addEventListener('mousedown', (e) => e.stopPropagation())
    autoLabel.addEventListener('pointerdown', (e) => e.stopPropagation())

    const pctCheck = document.createElement('input')
    pctCheck.type = 'checkbox'
    pctCheck.className = 'widget-dim-check'
    pctCheck.checked = node[modeKey] === 'percent'
    const pctLabel = document.createElement('label')
    pctLabel.className = 'widget-dim-check-label'
    pctLabel.textContent = '%'
    pctLabel.addEventListener('mousedown', (e) => e.stopPropagation())
    pctLabel.addEventListener('pointerdown', (e) => e.stopPropagation())

    // percent input field
    const pctInput = document.createElement('input')
    pctInput.type = 'number'
    pctInput.className = 'widget-dim-pct-input'
    pctInput.value = node[pctKey] || '100'
    pctInput.style.display = node[modeKey] === 'percent' ? '' : 'none'
    pctInput.addEventListener('input', (e) => {
      e.stopPropagation()
      node[pctKey] = pctInput.value
    })
    pctInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.stopPropagation(); pctInput.blur() }
    })
    pctInput.addEventListener('blur', () => node.graph?.save?.())
    pctInput.addEventListener('mousedown', (e) => e.stopPropagation())
    pctInput.addEventListener('pointerdown', (e) => e.stopPropagation())

    autoCheck.addEventListener('change', (e) => {
      e.stopPropagation()
      if (autoCheck.checked) { pctCheck.checked = false; node[modeKey] = 'auto' }
      else { node[modeKey] = '' }
      updateModeState()
      node.graph?.save?.()
    })
    autoCheck.addEventListener('mousedown', (e) => e.stopPropagation())
    autoCheck.addEventListener('pointerdown', (e) => e.stopPropagation())

    pctCheck.addEventListener('change', (e) => {
      e.stopPropagation()
      if (pctCheck.checked) { autoCheck.checked = false; node[modeKey] = 'percent' }
      else { node[modeKey] = '' }
      updateModeState()
      node.graph?.save?.()
    })
    pctCheck.addEventListener('mousedown', (e) => e.stopPropagation())
    pctCheck.addEventListener('pointerdown', (e) => e.stopPropagation())

    modeWrap.appendChild(autoCheck)
    modeWrap.appendChild(autoLabel)
    modeWrap.appendChild(pctCheck)
    modeWrap.appendChild(pctLabel)
    modeWrap.appendChild(pctInput)
    socket.socket.rowEl.appendChild(modeWrap)

    modeControls[dim] = { modeKey, intEl: socket.el, modeWrap, pctInput }
  }

  function updateModeState() {
    for (const ctrl of Object.values(modeControls)) {
      if (!ctrl.intEl) continue
      const mode = node[ctrl.modeKey]
      const disabled = mode === 'auto' || mode === 'percent'
      ctrl.intEl.classList.toggle('disabled', disabled)
      ctrl.intEl.style.pointerEvents = disabled ? 'none' : ''
      ctrl.pctInput.style.display = mode === 'percent' ? '' : 'none'
    }
  }
  updateModeState()

  // overflow dropdown in widget body
  const overflowRow = document.createElement('div')
  overflowRow.className = 'widget-div-overflow-row'
  const overflowLabel = document.createElement('span')
  overflowLabel.className = 'widget-div-overflow-label'
  overflowLabel.textContent = 'overflow'
  overflowRow.appendChild(overflowLabel)

  const overflowDropdown = createDropdownWidget({
    items: OVERFLOW_ITEMS,
    value: node.divOverflow,
    trackEl,
    onChange: (val) => {
      node.divOverflow = val
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
    for (const [dim, ctrl] of Object.entries(modeControls)) {
      const connected = sockets[dim].socket && sockets[dim].socket.connections.length > 0
      ctrl.modeWrap.style.display = connected ? 'none' : ''
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
