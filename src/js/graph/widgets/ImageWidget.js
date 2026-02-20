import { open } from '@tauri-apps/plugin-dialog'
import { convertFileSrc } from '@tauri-apps/api/core'
import { createIntegerWidget } from './IntegerWidget.js'
import { createBooleanWidget } from './BooleanWidget.js'
import { createStringWidget } from './StringWidget.js'

export function createImageWidget(node) {
  if (node.selectedFilePath === undefined) node.selectedFilePath = ''

  const wrap = document.createElement('div')
  wrap.className = 'widget-image'

  const toolbar = document.createElement('div')
  toolbar.className = 'widget-image-toolbar'

  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'widget-image-input'
  input.placeholder = 'file path...'
  input.value = node.selectedFilePath
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node.selectedFilePath = input.value
    update()
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      input.blur()
    }
  })
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'node-widget-btn node-widget-btn-icon'
  btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
  btn.title = 'Select image'
  btn.addEventListener('click', async (e) => {
    e.stopPropagation()
    const path = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] }]
    })
    if (path) {
      node.selectedFilePath = typeof path === 'string' ? path : path.path ?? path
      input.value = node.selectedFilePath
      update()
    }
  })

  toolbar.appendChild(input)
  toolbar.appendChild(btn)

  const imageArea = document.createElement('div')
  imageArea.className = 'widget-image-area'

  const img = document.createElement('img')
  img.className = 'widget-image-preview'
  img.alt = ''
  img.draggable = false

  const placeholder = document.createElement('div')
  placeholder.className = 'widget-image-placeholder'
  placeholder.textContent = 'No image'

  imageArea.appendChild(placeholder)
  imageArea.appendChild(img)

  // alt text toggle + field
  if (node.imageAltEnabled === undefined) node.imageAltEnabled = false
  if (node.imageAltText === undefined) node.imageAltText = ''

  const altRow = document.createElement('div')
  altRow.className = 'widget-image-alt-row'

  const altToggle = createBooleanWidget(node, {
    valueKey: 'imageAltEnabled',
    onChange: () => {
      altLabel.style.display = node.imageAltEnabled ? '' : 'none'
      altStringWrap.style.display = node.imageAltEnabled ? '' : 'none'
      node.requestResize?.()
    }
  })

  const altLabel = document.createElement('span')
  altLabel.className = 'widget-image-alt-label'
  altLabel.textContent = 'alt'
  altLabel.style.display = node.imageAltEnabled ? '' : 'none'

  const altStringWrap = document.createElement('div')
  altStringWrap.className = 'widget-image-alt-string'
  altStringWrap.style.display = node.imageAltEnabled ? '' : 'none'
  const altString = createStringWidget(node, {
    valueKey: 'imageAltText',
    placeholder: 'alt text...'
  })
  altStringWrap.appendChild(altString)

  altRow.appendChild(altToggle)
  altRow.appendChild(altLabel)
  altRow.appendChild(altStringWrap)

  wrap.appendChild(toolbar)
  wrap.appendChild(altRow)
  wrap.appendChild(imageArea)

  // inject integer widgets into socket rows
  if (node.imageWidth === undefined) node.imageWidth = '0'
  if (node.imageHeight === undefined) node.imageHeight = '0'

  const widthSocket = node.inputs.find(s => s.id === 'width')
  const heightSocket = node.inputs.find(s => s.id === 'height')

  let widthWidgetEl = null
  let heightWidgetEl = null

  if (widthSocket?.rowEl) {
    widthWidgetEl = createIntegerWidget(node, { valueKey: 'imageWidth' })
    widthWidgetEl.classList.add('widget-image-socket-int')
    widthSocket.rowEl.appendChild(widthWidgetEl)
  }
  if (heightSocket?.rowEl) {
    heightWidgetEl = createIntegerWidget(node, { valueKey: 'imageHeight' })
    heightWidgetEl.classList.add('widget-image-socket-int')
    heightSocket.rowEl.appendChild(heightWidgetEl)
  }

  // hook into socket connect/disconnect to toggle widget visibility
  for (const socket of [widthSocket, heightSocket]) {
    if (!socket) continue
    const origAdd = socket.addConnection.bind(socket)
    const origRemove = socket.removeConnection.bind(socket)
    socket.addConnection = (conn) => { origAdd(conn); updateSizeWidgetVisibility() }
    socket.removeConnection = (conn) => { origRemove(conn); updateSizeWidgetVisibility() }
  }

  function updateSizeWidgetVisibility() {
    const wConnected = widthSocket && widthSocket.connections.length > 0
    const hConnected = heightSocket && heightSocket.connections.length > 0
    if (widthWidgetEl) widthWidgetEl.style.display = wConnected ? 'none' : ''
    if (heightWidgetEl) heightWidgetEl.style.display = hConnected ? 'none' : ''
  }

  function setSizeFromImage(naturalW, naturalH) {
    node.imageWidth = String(naturalW)
    node.imageHeight = String(naturalH)
    const wScrub = widthWidgetEl?.querySelector('.widget-integer-scrub')
    const wInput = widthWidgetEl?.querySelector('.widget-integer-field')
    if (wScrub) wScrub.textContent = String(naturalW)
    if (wInput) wInput.value = String(naturalW)
    const hScrub = heightWidgetEl?.querySelector('.widget-integer-scrub')
    const hInput = heightWidgetEl?.querySelector('.widget-integer-field')
    if (hScrub) hScrub.textContent = String(naturalH)
    if (hInput) hInput.value = String(naturalH)
  }

  function update() {
    const pickerPath = node.selectedFilePath ?? ''
    const resolvedSrc = node._imageResolvedPath || (pickerPath ? convertFileSrc(pickerPath) : '')

    if (resolvedSrc) {
      img.src = resolvedSrc
      img.style.display = ''
      placeholder.style.display = 'none'
    } else {
      img.src = ''
      img.style.display = 'none'
      placeholder.style.display = ''
      placeholder.textContent = 'No image'
    }

    updateSizeWidgetVisibility()
    node.requestResize?.()
  }

  img.addEventListener('error', () => {
    img.style.display = 'none'
    placeholder.style.display = ''
    placeholder.textContent = 'Invalid path'
  })

  img.addEventListener('load', () => {
    setSizeFromImage(img.naturalWidth, img.naturalHeight)
    node.requestResize?.()
  })

  node._imageWidget = { update }
  update()
  return wrap
}
