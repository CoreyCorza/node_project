import { createDropdownWidget } from './DropdownWidget.js'
import { createBooleanWidget } from './BooleanWidget.js'

const CHARSET_ITEMS = [
  { value: 'UTF-8', label: 'UTF-8' },
  { value: 'ISO-8859-1', label: 'ISO-8859-1' },
  { value: 'UTF-16', label: 'UTF-16' },
  { value: 'ASCII', label: 'ASCII' }
]

const META_ITEMS = [
  { value: '', label: '(none)' },
  { value: 'robots', label: 'robots' },
  { value: 'description', label: 'description' },
  { value: 'author', label: 'author' },
  { value: 'keywords', label: 'keywords' }
]

const ROBOTS_ITEMS = [
  { value: 'index, follow', label: 'index, follow' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow' },
  { value: 'noindex, follow', label: 'noindex, follow' },
  { value: 'index, nofollow', label: 'index, nofollow' }
]

export function createHeadWidget(node) {
  const wrap = document.createElement('div')
  wrap.className = 'widget-head'

  // defaults
  if (node.headTitle === undefined) node.headTitle = ''
  if (node.headCharset === undefined) node.headCharset = 'UTF-8'
  if (node.headViewport === undefined) node.headViewport = true
  if (node.headMetaName === undefined) node.headMetaName = ''
  if (node.headMetaContent === undefined) node.headMetaContent = ''
  if (node.headMetaRobots === undefined) node.headMetaRobots = 'index, follow'
  if (node.headThemeColor === undefined) node.headThemeColor = ''
  if (node.headOgEnabled === undefined) node.headOgEnabled = false

  const trackEl = node.graph?.containerEl ?? null

  // --- TITLE section ---
  const titleSection = createSection('title')
  const titleInput = document.createElement('input')
  titleInput.type = 'text'
  titleInput.className = 'widget-string-field'
  titleInput.value = node.headTitle
  titleInput.placeholder = 'Page title'
  titleInput.autocomplete = 'off'
  titleInput.addEventListener('input', (e) => {
    e.stopPropagation()
    node.headTitle = titleInput.value
  })
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.stopPropagation(); titleInput.blur() }
  })
  titleInput.addEventListener('blur', () => node.graph?.save?.())
  titleInput.addEventListener('mousedown', (e) => e.stopPropagation())
  titleInput.addEventListener('pointerdown', (e) => e.stopPropagation())
  titleSection.appendChild(titleInput)
  wrap.appendChild(titleSection)

  // --- CHARSET section ---
  const charsetSection = createSection('charset')
  const charsetDropdown = createDropdownWidget({
    items: CHARSET_ITEMS,
    value: node.headCharset,
    trackEl,
    onChange: (val) => { node.headCharset = val; node.graph?.save?.() }
  })
  charsetDropdown.classList.add('widget-head-dropdown')
  charsetSection.appendChild(charsetDropdown)
  wrap.appendChild(charsetSection)

  // --- VIEWPORT section ---
  const viewportSection = createSection('viewport')
  const viewportRow = document.createElement('div')
  viewportRow.className = 'widget-head-viewport-row'
  const vpToggle = createBooleanWidget(node, {
    valueKey: 'headViewport',
    onChange: () => updateViewportLabel()
  })
  vpToggle.classList.add('widget-head-toggle')
  viewportRow.appendChild(vpToggle)
  const vpLabel = document.createElement('span')
  vpLabel.className = 'widget-head-viewport-text'
  viewportRow.appendChild(vpLabel)
  function updateViewportLabel() {
    vpLabel.textContent = node.headViewport ? 'width=device-width, initial-scale=1.0' : 'disabled'
    vpLabel.classList.toggle('disabled', !node.headViewport)
  }
  updateViewportLabel()
  viewportSection.appendChild(viewportRow)
  wrap.appendChild(viewportSection)

  // --- META section ---
  const metaSection = createSection('meta')
  const metaDropdown = createDropdownWidget({
    items: META_ITEMS,
    value: node.headMetaName,
    trackEl,
    onChange: (val) => {
      node.headMetaName = val
      updateMetaVisibility()
      node.graph?.save?.()
    }
  })
  metaDropdown.classList.add('widget-head-dropdown')
  metaSection.appendChild(metaDropdown)

  // robots sub-dropdown
  const robotsDropdown = createDropdownWidget({
    items: ROBOTS_ITEMS,
    value: node.headMetaRobots,
    trackEl,
    onChange: (val) => { node.headMetaRobots = val; node.graph?.save?.() }
  })
  robotsDropdown.classList.add('widget-head-dropdown', 'widget-head-meta-robots')
  metaSection.appendChild(robotsDropdown)

  // meta content text field (for description/author/keywords)
  const metaContentInput = document.createElement('input')
  metaContentInput.type = 'text'
  metaContentInput.className = 'widget-string-field widget-head-meta-content'
  metaContentInput.value = node.headMetaContent
  metaContentInput.placeholder = 'content...'
  metaContentInput.autocomplete = 'off'
  metaContentInput.addEventListener('input', (e) => {
    e.stopPropagation()
    node.headMetaContent = metaContentInput.value
  })
  metaContentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.stopPropagation(); metaContentInput.blur() }
  })
  metaContentInput.addEventListener('blur', () => node.graph?.save?.())
  metaContentInput.addEventListener('mousedown', (e) => e.stopPropagation())
  metaContentInput.addEventListener('pointerdown', (e) => e.stopPropagation())
  metaSection.appendChild(metaContentInput)

  function updateMetaVisibility() {
    const sel = node.headMetaName
    robotsDropdown.style.display = sel === 'robots' ? '' : 'none'
    metaContentInput.style.display = ['description', 'author', 'keywords'].includes(sel) ? '' : 'none'
  }
  updateMetaVisibility()
  wrap.appendChild(metaSection)

  // --- THEME COLOR section ---
  const colorSection = createSection('theme color')
  const colorRow = document.createElement('div')
  colorRow.className = 'widget-head-color-row'
  const colorPicker = document.createElement('input')
  colorPicker.type = 'color'
  colorPicker.className = 'widget-color-picker widget-head-color-picker'
  colorPicker.value = node.headThemeColor || '#000000'
  colorPicker.addEventListener('input', (e) => {
    e.stopPropagation()
    node.headThemeColor = colorPicker.value
    colorHex.value = colorPicker.value
  })
  colorPicker.addEventListener('change', () => node.graph?.save?.())
  colorPicker.addEventListener('mousedown', (e) => e.stopPropagation())
  colorPicker.addEventListener('pointerdown', (e) => e.stopPropagation())
  colorRow.appendChild(colorPicker)

  const colorHex = document.createElement('input')
  colorHex.type = 'text'
  colorHex.className = 'widget-string-field widget-head-color-hex'
  colorHex.value = node.headThemeColor || '#000000'
  colorHex.autocomplete = 'off'
  colorHex.addEventListener('input', (e) => {
    e.stopPropagation()
    node.headThemeColor = colorHex.value
    if (/^#[0-9a-fA-F]{6}$/.test(colorHex.value)) {
      colorPicker.value = colorHex.value
    }
  })
  colorHex.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.stopPropagation(); colorHex.blur() }
  })
  colorHex.addEventListener('blur', () => node.graph?.save?.())
  colorHex.addEventListener('mousedown', (e) => e.stopPropagation())
  colorHex.addEventListener('pointerdown', (e) => e.stopPropagation())
  colorRow.appendChild(colorHex)

  colorSection.appendChild(colorRow)
  wrap.appendChild(colorSection)

  // --- OPEN GRAPH section ---
  const ogSection = createSection('open graph')
  const ogToggle = createBooleanWidget(node, {
    valueKey: 'headOgEnabled',
    label: 'OG Tags'
  })
  ogToggle.classList.add('widget-head-toggle')
  ogSection.appendChild(ogToggle)
  wrap.appendChild(ogSection)

  return wrap
}

function createSection(label) {
  const section = document.createElement('div')
  section.className = 'widget-head-section'
  const labelEl = document.createElement('div')
  labelEl.className = 'widget-head-section-label'
  labelEl.textContent = label
  section.appendChild(labelEl)
  return section
}
