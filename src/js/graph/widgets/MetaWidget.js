import { createDropdownWidget } from './DropdownWidget.js'

const META_ITEMS = [
  { value: 'viewport', label: 'viewport' },
  { value: 'description', label: 'description' },
  { value: 'author', label: 'author' },
  { value: 'keywords', label: 'keywords' },
  { value: 'robots', label: 'robots' },
  { value: 'theme-color', label: 'theme-color' },
  { value: 'custom', label: 'custom' }
]

const ROBOTS_ITEMS = [
  { value: 'index, follow', label: 'index, follow' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow' },
  { value: 'noindex, follow', label: 'noindex, follow' },
  { value: 'index, nofollow', label: 'index, nofollow' }
]

export function createMetaWidget(node) {
  const wrap = document.createElement('div')
  wrap.className = 'widget-meta'

  // defaults
  if (node.metaName === undefined) node.metaName = 'viewport'
  if (node.metaContent === undefined) node.metaContent = ''
  if (node.metaRobots === undefined) node.metaRobots = 'index, follow'
  if (node.metaCustomName === undefined) node.metaCustomName = ''

  // --- meta name dropdown ---
  const trackEl = node.graph?.containerEl ?? null
  const metaDropdown = createDropdownWidget({
    items: META_ITEMS,
    value: node.metaName,
    trackEl,
    onChange: (val) => {
      node.metaName = val
      updateVisibility()
      node.graph?.save?.()
    }
  })
  metaDropdown.classList.add('widget-meta-dropdown')
  wrap.appendChild(metaDropdown)

  // --- robots dropdown ---
  const robotsDropdown = createDropdownWidget({
    items: ROBOTS_ITEMS,
    value: node.metaRobots,
    trackEl,
    onChange: (val) => {
      node.metaRobots = val
      node.graph?.save?.()
    }
  })
  robotsDropdown.classList.add('widget-meta-robots')
  wrap.appendChild(robotsDropdown)

  // --- content text field (injected into content socket row) ---
  const contentSocket = node.inputs.find(s => s.id === 'content')
  let contentFieldEl = null
  if (contentSocket?.rowEl) {
    contentFieldEl = createTextField(node, 'metaContent')
    contentFieldEl.classList.add('widget-socket-str')
    contentSocket.rowEl.appendChild(contentFieldEl)
  }

  // --- name text field (injected into name socket row) ---
  const nameSocket = node.inputs.find(s => s.id === 'name')
  let nameFieldEl = null
  if (nameSocket?.rowEl) {
    nameFieldEl = createTextField(node, 'metaCustomName', 'name...')
    nameFieldEl.classList.add('widget-socket-str')
    nameSocket.rowEl.appendChild(nameFieldEl)
  }

  // --- visibility logic ---
  function updateVisibility() {
    const sel = node.metaName

    // content field: show for description/author/keywords/custom (unless socket connected)
    const showContent = ['description', 'author', 'keywords', 'custom'].includes(sel)
    const contentConnected = contentSocket && contentSocket.connections.length > 0
    if (contentFieldEl) contentFieldEl.style.display = (showContent && !contentConnected) ? '' : 'none'

    // name field: show for custom only (unless socket connected)
    const nameConnected = nameSocket && nameSocket.connections.length > 0
    if (nameFieldEl) nameFieldEl.style.display = (sel === 'custom' && !nameConnected) ? '' : 'none'

    // robots dropdown: show only for robots
    robotsDropdown.style.display = sel === 'robots' ? '' : 'none'
  }

  // hook socket connect/disconnect for content socket
  if (contentSocket) {
    const origAdd = contentSocket.addConnection.bind(contentSocket)
    const origRemove = contentSocket.removeConnection.bind(contentSocket)
    contentSocket.addConnection = (conn) => { origAdd(conn); updateVisibility() }
    contentSocket.removeConnection = (conn) => { origRemove(conn); updateVisibility() }
  }

  // hook socket connect/disconnect for name socket
  if (nameSocket) {
    const origAdd = nameSocket.addConnection.bind(nameSocket)
    const origRemove = nameSocket.removeConnection.bind(nameSocket)
    nameSocket.addConnection = (conn) => { origAdd(conn); updateVisibility() }
    nameSocket.removeConnection = (conn) => { origRemove(conn); updateVisibility() }
  }

  updateVisibility()
  return wrap
}

function createTextField(node, valueKey, placeholder = '') {
  const fieldWrap = document.createElement('div')
  fieldWrap.className = 'widget-meta-field'

  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'widget-string-field'
  input.value = node[valueKey] || ''
  input.placeholder = placeholder
  input.autocomplete = 'off'
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node[valueKey] = input.value
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      input.blur()
    }
  })
  input.addEventListener('blur', () => {
    node.graph?.save?.()
  })
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())
  fieldWrap.appendChild(input)

  return fieldWrap
}
