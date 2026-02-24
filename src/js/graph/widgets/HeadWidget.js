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

const OG_ITEMS = [
  { value: 'og:title', label: 'og:title' },
  { value: 'og:description', label: 'og:description' },
  { value: 'og:image', label: 'og:image' }
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
  if (node.headOgEnabled === undefined) node.headOgEnabled = false
  if (node.headOgType === undefined) node.headOgType = 'og:title'
  if (node.headOgTitle === undefined) node.headOgTitle = ''
  if (node.headOgDescription === undefined) node.headOgDescription = ''

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

  // --- OPEN GRAPH section ---
  const ogSection = createSection('open graph')
  const ogRow = document.createElement('div')
  ogRow.className = 'widget-head-og-row'

  const ogToggle = createBooleanWidget(node, {
    valueKey: 'headOgEnabled',
    onChange: () => {
      if (!node.headOgEnabled) {
        node.headOgType = 'og:title'
        ogDropdown.setValue('og:title')
      }
      updateOgVisibility()
    }
  })
  ogToggle.classList.add('widget-head-toggle')
  ogRow.appendChild(ogToggle)
  ogSection.appendChild(ogRow)

  // OG dropdown
  const ogDropdown = createDropdownWidget({
    items: OG_ITEMS,
    value: node.headOgType,
    trackEl,
    onChange: (val) => {
      node.headOgType = val
      updateOgVisibility()
      node.graph?.save?.()
    }
  })
  ogDropdown.classList.add('widget-head-dropdown', 'widget-head-og-dropdown')
  ogSection.appendChild(ogDropdown)

  // OG title text field
  const ogTitleInput = document.createElement('input')
  ogTitleInput.type = 'text'
  ogTitleInput.className = 'widget-string-field widget-head-og-field'
  ogTitleInput.value = node.headOgTitle
  ogTitleInput.placeholder = 'og:title...'
  ogTitleInput.autocomplete = 'off'
  ogTitleInput.addEventListener('input', (e) => {
    e.stopPropagation()
    node.headOgTitle = ogTitleInput.value
  })
  ogTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.stopPropagation(); ogTitleInput.blur() }
  })
  ogTitleInput.addEventListener('blur', () => node.graph?.save?.())
  ogTitleInput.addEventListener('mousedown', (e) => e.stopPropagation())
  ogTitleInput.addEventListener('pointerdown', (e) => e.stopPropagation())
  ogSection.appendChild(ogTitleInput)

  // OG description text field
  const ogDescInput = document.createElement('input')
  ogDescInput.type = 'text'
  ogDescInput.className = 'widget-string-field widget-head-og-field'
  ogDescInput.value = node.headOgDescription
  ogDescInput.placeholder = 'og:description...'
  ogDescInput.autocomplete = 'off'
  ogDescInput.addEventListener('input', (e) => {
    e.stopPropagation()
    node.headOgDescription = ogDescInput.value
  })
  ogDescInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.stopPropagation(); ogDescInput.blur() }
  })
  ogDescInput.addEventListener('blur', () => node.graph?.save?.())
  ogDescInput.addEventListener('mousedown', (e) => e.stopPropagation())
  ogDescInput.addEventListener('pointerdown', (e) => e.stopPropagation())
  ogSection.appendChild(ogDescInput)

  // move og:image socket row into widget section
  const ogImageSocket = node.inputs.find(s => s.id === 'og-image')
  if (ogImageSocket?.rowEl) {
    ogSection.appendChild(ogImageSocket.rowEl)
  }

  function updateOgVisibility() {
    const enabled = node.headOgEnabled
    const sel = node.headOgType || 'og:title'
    ogDropdown.style.display = enabled ? '' : 'none'
    ogTitleInput.style.display = enabled && sel === 'og:title' ? '' : 'none'
    ogDescInput.style.display = enabled && sel === 'og:description' ? '' : 'none'
    const showImage = enabled && sel === 'og:image'
    if (ogImageSocket?.rowEl) {
      ogImageSocket.rowEl.style.display = showImage ? '' : 'none'
    }
    // disconnect og:image socket when hidden
    if (!showImage && ogImageSocket) {
      [...ogImageSocket.connections].forEach(n => n.remove())
    }
    node.requestResize?.()
  }
  updateOgVisibility()
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
