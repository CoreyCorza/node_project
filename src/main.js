import './css/base.css'
import './css/toolbar.css'
import './css/split-pane.css'
import './css/node-graph.css'
import './css/node.css'
import './css/socket.css'
import './css/noodles.css'
import './css/widgets/index.css'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open, save, confirm } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { Graph } from './js/graph/index.js'
import { Preview } from './js/Preview.js'
import { Console } from './js/Console.js'
import { createBooleanWidget } from './js/graph/widgets/BooleanWidget.js'

function disableNativeTooltips() {
  const migrate = el => {
    if (el.nodeType !== 1) return
    if (el.hasAttribute?.('title')) {
      el.dataset.tooltip = el.getAttribute('title')
      el.removeAttribute('title')
    }
    el.querySelectorAll?.('[title]').forEach(migrate)
  }
  migrate(document.body)
  new MutationObserver(mutations => {
    for (const m of mutations)
      for (const n of m.addedNodes) {
        const el = n.nodeType === 1 ? n : n.parentElement
        if (el) migrate(el)
      }
  }).observe(document.body, { childList: true, subtree: true })
}

disableNativeTooltips()

const tooltipEl = document.createElement('div')
tooltipEl.className = 'tooltip'
document.body.appendChild(tooltipEl)

let tooltipShowTimeout = null
let tooltipHideTimeout = null
const TOOLTIP_SHOW_DELAY = 20
const TOOLTIP_HIDE_DELAY = 2

function showTooltip(el) {
  const text = el.dataset.tooltip
  if (!text) return
  tooltipEl.textContent = text
  tooltipEl.style.left = '-9999px'
  tooltipEl.style.top = '0'
  tooltipEl.classList.add('visible')
  tooltipEl.offsetHeight
  const rect = el.getBoundingClientRect()
  const ttRect = tooltipEl.getBoundingClientRect()
  const pad = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left, top
  if (el.dataset.tooltipPosition === 'above') {
    left = rect.left + (rect.width - ttRect.width) / 2
    top = rect.top - ttRect.height - pad
  } else if (el.dataset.tooltipPosition === 'below') {
    left = rect.left + (rect.width - ttRect.width) / 2
    top = rect.bottom + pad
  } else {
    left = rect.right + pad
    top = rect.top + (rect.height - ttRect.height) / 2
    if (left + ttRect.width > vw - pad) left = rect.left - ttRect.width - pad
  }
  left = Math.max(pad, Math.min(vw - ttRect.width - pad, left))
  top = Math.max(pad, Math.min(vh - ttRect.height - pad, top))
  tooltipEl.style.left = `${left}px`
  tooltipEl.style.top = `${top}px`
}

document.body.addEventListener('mouseover', e => {
  if (document.body.classList.contains('popover-open') || document.body.classList.contains('context-menu-open')) {
    clearTimeout(tooltipShowTimeout)
    clearTimeout(tooltipHideTimeout)
    tooltipHideTimeout = setTimeout(() => tooltipEl.classList.remove('visible'), TOOLTIP_HIDE_DELAY)
    return
  }
  const el = e.target.closest('[data-tooltip]')
  if (!el) {
    clearTimeout(tooltipShowTimeout)
    tooltipHideTimeout = setTimeout(() => tooltipEl.classList.remove('visible'), TOOLTIP_HIDE_DELAY)
    return
  }
  clearTimeout(tooltipHideTimeout)
  clearTimeout(tooltipShowTimeout)
  tooltipShowTimeout = setTimeout(() => showTooltip(el), TOOLTIP_SHOW_DELAY)
})
document.body.addEventListener('mouseout', e => {
  if (!e.relatedTarget?.closest?.('[data-tooltip]')) {
    clearTimeout(tooltipShowTimeout)
    tooltipShowTimeout = null
    tooltipHideTimeout = setTimeout(() => tooltipEl.classList.remove('visible'), TOOLTIP_HIDE_DELAY)
  }
})

const appWindow = getCurrentWindow()

setTimeout(() => {
  appWindow.show()
  appWindow.setFocus()
  document.body.classList.add('ready')
}, 150)

const app = document.getElementById('app')

const splitPane = document.createElement('div')
splitPane.className = 'split-pane horizontal'

const splitPaneLeft = document.createElement('div')
splitPaneLeft.className = 'split-pane-left'

const splitter = document.createElement('div')
splitter.className = 'splitter'

const splitPaneRight = document.createElement('div')
splitPaneRight.className = 'split-pane-right'

const preview = new Preview()
splitPaneRight.appendChild(preview.getElement())

splitPane.appendChild(splitPaneLeft)
splitPane.appendChild(splitter)
splitPane.appendChild(splitPaneRight)
app.appendChild(splitPane)

const graphWrap = document.createElement('div')
graphWrap.className = 'node-graph-wrap'
const graphContainer = document.createElement('div')
graphContainer.className = 'node-graph'


function initSplitter() {
  const storageKey = 'node-graph-split'
  let rightSize = 40
  try {
    const s = JSON.parse(localStorage.getItem(storageKey) || '{}')
    if (typeof s.previewSize === 'number') rightSize = Math.max(15, Math.min(85, s.previewSize))
  } catch {}
  splitPaneRight.style.flex = `0 0 ${rightSize}%`

  let dragging = false
  let startX = 0
  let startRightSize = 0
  let rafId = null

  splitter.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    dragging = true
    splitter.classList.add('dragging')
    startX = e.clientX
    const flexMatch = splitPaneRight.style.flex?.match(/(\d+(?:\.\d+)?)%/)
    startRightSize = flexMatch ? parseFloat(flexMatch[1]) : 40
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.body.style.pointerEvents = 'none'

    const onMove = (ev) => {
      if (!dragging) return
      ev.preventDefault()
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = null
        const total = splitPane.offsetWidth
        if (total <= 0) return
        const dx = ev.clientX - startX
        const deltaPercent = (dx / total) * 100
        let newRight = startRightSize - deltaPercent
        newRight = Math.max(15, Math.min(85, newRight))
        splitPaneRight.style.flex = `0 0 ${newRight}%`
      })
    }

    const onUp = () => {
      dragging = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = null
      splitter.classList.remove('dragging')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      const flex = splitPaneRight.style.flex
      const match = flex?.match(/(\d+(?:\.\d+)?)%/)
      if (match) {
        try {
          const s = JSON.parse(localStorage.getItem(storageKey) || '{}')
          s.previewSize = parseFloat(match[1])
          localStorage.setItem(storageKey, JSON.stringify(s))
        } catch {}
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })
}

initSplitter()

function setPreviewVisible(visible) {
  splitPane.classList.toggle('preview-hidden', !visible)
  const btn = document.querySelector('.toolbar-preview-btn')
  if (btn) {
    btn.dataset.previewVisible = String(visible)
    btn.classList.toggle('active', visible)
  }
  try {
    const s = JSON.parse(localStorage.getItem('node-graph-split') || '{}')
    s.previewVisible = visible
    localStorage.setItem('node-graph-split', JSON.stringify(s))
  } catch {}
}

const toolbar = document.createElement('div')
toolbar.className = 'toolbar'
toolbar.innerHTML = `
  <button class="toolbar-btn" type="button" data-action="new" data-tooltip="New" data-tooltip-position="below">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  </button>
  <button class="toolbar-btn" type="button" data-action="add" data-tooltip="Add" data-tooltip-position="below">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
  </button>
  <button class="toolbar-btn" type="button" data-action="open" data-tooltip="Open" data-tooltip-position="below">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  </button>
  <button class="toolbar-btn" type="button" data-action="save" data-tooltip="Save" data-tooltip-position="below">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  </button>
  <div class="toolbar-divider"></div>
  <div class="toolbar-settings-wrap">
    <button class="toolbar-btn toolbar-settings-btn" type="button" data-tooltip="Settings" data-tooltip-position="below">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
    <div class="settings-popover" hidden>
      <div class="settings-popover-menu">
        <div class="settings-menu-label">Noodles</div>
        <button class="settings-menu-item" type="button" data-noodle-style="smooth">Smooth curves</button>
        <button class="settings-menu-item" type="button" data-noodle-style="linear">Linear straight</button>
        <div class="settings-menu-divider"></div>
        <div class="settings-menu-label">Interface</div>
        <div class="settings-menu-toggle-row" data-tooltips-container></div>
        <div class="settings-menu-divider"></div>
        <div class="settings-menu-label">Developer</div>
        <div class="settings-menu-toggle-row" data-debug-container></div>
        <div class="settings-menu-toggle-row" data-console-autostart-container></div>
      </div>
    </div>
  </div>
  <button class="toolbar-btn" type="button" data-action="console" data-tooltip="Console" data-tooltip-position="below">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  </button>
  <div class="toolbar-spacer"></div>
  <button class="toolbar-btn toolbar-preview-btn" type="button" data-tooltip="Preview" data-tooltip-position="below" data-preview-visible="true">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  </button>
`
splitPaneLeft.appendChild(toolbar)
graphWrap.appendChild(graphContainer)
splitPaneLeft.appendChild(graphWrap)

toolbar.addEventListener('click', (e) => {
  const btn = e.target.closest('.toolbar-btn')
  if (!btn) return
  btn.classList.remove('flash')
  btn.offsetHeight
  btn.classList.add('flash')
  btn.addEventListener('animationend', () => btn.classList.remove('flash'), { once: true })
})

const playbar = document.createElement('div')
playbar.className = 'playbar'
playbar.innerHTML = `
  <button class="playbar-btn" type="button">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
  </button>
  <button class="playbar-btn" type="button" data-action="stop">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
  </button>
`
app.appendChild(playbar)

const progressEl = document.createElement('div')
progressEl.className = 'playbar-progress'
progressEl.innerHTML = `
  <div class="playbar-progress-track">
    <div class="playbar-progress-fill"></div>
  </div>
  <div class="playbar-progress-label"></div>
`
app.appendChild(progressEl)

playbar.addEventListener('click', async (e) => {
  const btn = e.target.closest('.playbar-btn')
  if (!btn) return
  btn.classList.remove('flash')
  btn.offsetHeight
  btn.classList.add('flash')
  btn.addEventListener('animationend', () => btn.classList.remove('flash'), { once: true })
  if (btn.dataset.action === 'stop') return

  const track = progressEl.querySelector('.playbar-progress-track')
  const fill = progressEl.querySelector('.playbar-progress-fill')
  const label = progressEl.querySelector('.playbar-progress-label')
  progressEl.classList.remove('completed', 'animating')
  fill.style.width = '0'
  fill.style.display = ''
  track.style.display = ''
  label.textContent = ''
  progressEl.classList.add('visible')
  progressEl.offsetHeight
  fill.style.removeProperty('width')
  progressEl.offsetHeight
  progressEl.classList.add('animating')

  graph.setPulseNoodles(true)
  const r = await graph.execute()
  if (!r.ok) console.error(r.error)

  await new Promise(r => setTimeout(r, 2000))
  graph.setPulseNoodles(false)
  progressEl.classList.remove('animating')
  progressEl.classList.add('completed')
  track.style.display = 'none'
  fill.style.display = 'none'
  label.textContent = 'Completed'
  await new Promise(r => setTimeout(r, 800))
  progressEl.classList.remove('visible')
})

const defaultGraph = () => ({
  nodes: [],
  connections: []
})

const graph = new Graph(graphContainer)
try {
  const saved = localStorage.getItem('node-graph-state')
  const data = saved ? JSON.parse(saved) : null
  graph.load(data?.nodes?.length ? data : defaultGraph())
} catch {
  graph.load(defaultGraph())
}
graph.centerViewOnNodes()

// --- Project save/load ---
const crzFilter = { name: 'CRZ Project', extensions: ['crz'] }
let currentProjectPath = null
let projectDirty = false

const origSave = graph.save.bind(graph)
graph.save = () => { projectDirty = true; origSave() }

function updateTitle() {
  if (currentProjectPath) {
    const name = currentProjectPath.replace(/\\/g, '/').split('/').pop()
    appWindow.setTitle(`NodeProject — ${name}`)
  } else {
    appWindow.setTitle('NodeProject — Untitled')
  }
}

async function saveProject(forceDialog = false) {
  try {
    let path = currentProjectPath
    if (!path || forceDialog) {
      path = await save({ filters: [crzFilter], defaultPath: currentProjectPath || undefined })
      if (!path) return
      if (!path.endsWith('.crz')) path += '.crz'
    }
    const data = JSON.stringify(graph.serialize(), null, 2)
    await writeTextFile(path, data)
    currentProjectPath = path
    projectDirty = false
    updateTitle()
  } catch (err) {
    console.error('Save failed:', err)
  }
}

async function openProject() {
  try {
    const path = await open({ multiple: false, directory: false, filters: [crzFilter] })
    if (!path) return
    const raw = await readTextFile(typeof path === 'string' ? path : path.path ?? path)
    const data = JSON.parse(raw)
    graph.load(data?.nodes?.length ? data : { nodes: [], connections: [] })
    graph.centerViewOnNodes()
    currentProjectPath = typeof path === 'string' ? path : path.path ?? path
    updateTitle()
    origSave()
    projectDirty = false
  } catch (err) {
    console.error('Open failed:', err)
  }
}

async function newProject() {
  try {
    if (graph.nodes.length > 0 && projectDirty) {
      const shouldSave = await confirm('Save current project before creating a new one?', {
        title: 'New Project',
        kind: 'warning',
        okLabel: 'Save',
        cancelLabel: 'Discard'
      })
      if (shouldSave) {
        await saveProject()
        // If user cancelled the save dialog, don't clear
        if (projectDirty) return
      }
    }
    graph.clear()
    currentProjectPath = null
    updateTitle()
    origSave()
    projectDirty = false
  } catch (err) {
    console.error('New project failed:', err)
  }
}

toolbar.querySelector('[data-action="new"]').addEventListener('click', () => newProject())
toolbar.querySelector('[data-action="save"]').addEventListener('click', () => saveProject(true))
toolbar.querySelector('[data-action="open"]').addEventListener('click', () => openProject())

// --- System Console ---
const systemConsole = new Console({ getDebugEnabled: () => debugState.debug })
systemConsole.instrumentGraph(graph)

toolbar.querySelector('[data-action="console"]').addEventListener('click', () => systemConsole.open())

document.addEventListener('keydown', (e) => {
  if (e.key === 's' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
    e.preventDefault()
    saveProject(true)
  } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    saveProject()
  } else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    openProject()
  }
})

const settingsWrap = toolbar.querySelector('.toolbar-settings-wrap')
const settingsBtn = toolbar.querySelector('.toolbar-settings-btn')
const settingsPopover = toolbar.querySelector('.settings-popover')
const settingsMenuItems = toolbar.querySelectorAll('.settings-menu-item[data-noodle-style]')

function closeSettingsPopover() {
  settingsPopover.hidden = true
  document.body.classList.remove('popover-open')
}

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  settingsPopover.hidden = !settingsPopover.hidden
  if (!settingsPopover.hidden) {
    document.body.classList.add('popover-open')
    tooltipEl.classList.remove('visible')
    const btnRect = settingsBtn.getBoundingClientRect()
    settingsPopover.style.left = ''
    settingsPopover.style.top = ''
    settingsPopover.style.right = ''
    settingsPopover.style.bottom = ''
    settingsPopover.offsetHeight
    const pw = settingsPopover.offsetWidth
    const ph = settingsPopover.offsetHeight
    const gap = 4
    const pad = 8
    let left = btnRect.left + (btnRect.width - pw) / 2
    if (left < pad) left = pad
    if (left + pw > window.innerWidth - pad) left = window.innerWidth - pw - pad
    let top = btnRect.top - ph - gap
    if (top < pad) top = btnRect.bottom + gap
    if (top + ph > window.innerHeight - pad) top = window.innerHeight - ph - pad
    settingsPopover.style.left = left + 'px'
    settingsPopover.style.top = top + 'px'
    settingsMenuItems.forEach(el => {
      el.classList.toggle('active', graph.noodleStyle === el.dataset.noodleStyle)
    })
  } else {
    document.body.classList.remove('popover-open')
  }
})

settingsMenuItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const style = btn.dataset.noodleStyle
    graph.setNoodleStyle(style)
    settingsMenuItems.forEach(el => el.classList.toggle('active', el.dataset.noodleStyle === style))
  })
})

// Tooltips toggle - uses shared createBooleanWidget
const tooltipsContainer = toolbar.querySelector('[data-tooltips-container]')
const tooltipsState = { tooltips: true }
try {
  const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
  if (s.tooltips === false) {
    document.body.classList.add('tooltips-disabled')
    tooltipsState.tooltips = false
  }
} catch {}
const tooltipsWidget = createBooleanWidget(tooltipsState, {
  label: 'Tooltips',
  valueKey: 'tooltips',
  onChange: () => {
    const disabled = !tooltipsState.tooltips
    document.body.classList.toggle('tooltips-disabled', disabled)
    try {
      const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
      s.tooltips = tooltipsState.tooltips
      localStorage.setItem('node-graph-settings', JSON.stringify(s))
    } catch {}
  }
})
tooltipsContainer.appendChild(tooltipsWidget)

// Debug mode toggle
const debugContainer = toolbar.querySelector('[data-debug-container]')
const debugState = { debug: true }
try {
  const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
  if (s.debug === false) debugState.debug = false
} catch {}
const debugWidget = createBooleanWidget(debugState, {
  label: 'Debug Mode',
  valueKey: 'debug',
  onChange: () => {
    try {
      const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
      s.debug = debugState.debug
      localStorage.setItem('node-graph-settings', JSON.stringify(s))
    } catch {}
  }
})
debugContainer.appendChild(debugWidget)

// Console auto-start toggle
const consoleAutoStartContainer = toolbar.querySelector('[data-console-autostart-container]')
const consoleAutoStartState = { consoleAutoStart: true }
try {
  const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
  if (s.consoleAutoStart === false) consoleAutoStartState.consoleAutoStart = false
} catch {}
const consoleAutoStartWidget = createBooleanWidget(consoleAutoStartState, {
  label: 'Console on Startup',
  valueKey: 'consoleAutoStart',
  onChange: () => {
    try {
      const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
      s.consoleAutoStart = consoleAutoStartState.consoleAutoStart
      localStorage.setItem('node-graph-settings', JSON.stringify(s))
    } catch {}
  }
})
consoleAutoStartContainer.appendChild(consoleAutoStartWidget)

if (consoleAutoStartState.consoleAutoStart) systemConsole.open()

const previewBtn = toolbar.querySelector('.toolbar-preview-btn')
try {
  const s = JSON.parse(localStorage.getItem('node-graph-split') || '{}')
  if (s.previewVisible === false) setPreviewVisible(false)
} catch {}
previewBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  const visible = previewBtn.dataset.previewVisible !== 'true'
  setPreviewVisible(visible)
})

document.addEventListener('click', (e) => {
  if (!settingsWrap.contains(e.target)) closeSettingsPopover()
})
