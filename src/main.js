import './css/base.css'
import './css/node-graph.css'
import './css/node.css'
import './css/socket.css'
import './css/noodles.css'
import './css/widgets/index.css'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Graph } from './js/graph/index.js'

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

function showTooltip(el) {
  const text = el.dataset.tooltip
  if (!text) return
  clearTimeout(tooltipHideTimeout)
  tooltipEl.textContent = text
  tooltipEl.style.left = '-9999px'
  tooltipEl.style.top = '0'
  tooltipEl.classList.add('visible')
  const rect = el.getBoundingClientRect()
  const ttRect = tooltipEl.getBoundingClientRect()
  const pad = 6
  let left, top
  if (el.dataset.tooltipPosition === 'above') {
    left = rect.left + (rect.width - ttRect.width) / 2
    top = rect.top - ttRect.height - pad
  } else {
    left = rect.left - ttRect.width - pad
    top = rect.top + (rect.height - ttRect.height) / 2
    if (left < 8) left = rect.right + pad
  }
  tooltipEl.style.left = `${left}px`
  tooltipEl.style.top = `${top}px`
}

document.body.addEventListener('mouseover', e => {
  if (document.body.classList.contains('popover-open') || document.body.classList.contains('context-menu-open')) {
    clearTimeout(tooltipShowTimeout)
    tooltipHideTimeout = setTimeout(() => tooltipEl.classList.remove('visible'), 50)
    return
  }
  const el = e.target.closest('[data-tooltip]')
  if (!el) {
    clearTimeout(tooltipShowTimeout)
    tooltipHideTimeout = setTimeout(() => tooltipEl.classList.remove('visible'), 50)
    return
  }
  clearTimeout(tooltipShowTimeout)
  clearTimeout(tooltipHideTimeout)
  showTooltip(el)
})
document.body.addEventListener('mouseout', e => {
  if (!e.relatedTarget?.closest?.('[data-tooltip]')) {
    tooltipHideTimeout = setTimeout(() => tooltipEl.classList.remove('visible'), 50)
  }
})

const appWindow = getCurrentWindow()

setTimeout(() => {
  appWindow.show()
  appWindow.setFocus()
  document.body.classList.add('ready')
}, 150)

const app = document.getElementById('app')
const graphContainer = document.createElement('div')
graphContainer.className = 'node-graph'
app.appendChild(graphContainer)

const toolbar = document.createElement('div')
toolbar.className = 'toolbar'
toolbar.innerHTML = `
  <button class="toolbar-btn" type="button" data-tooltip="Add" data-tooltip-position="left">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
  </button>
  <button class="toolbar-btn" type="button" data-tooltip="Open" data-tooltip-position="left">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  </button>
  <button class="toolbar-btn" type="button" data-tooltip="Save" data-tooltip-position="left">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  </button>
  <div class="toolbar-spacer"></div>
  <div class="toolbar-settings-wrap">
    <button class="toolbar-btn toolbar-settings-btn" type="button" data-tooltip="Settings" data-tooltip-position="left">
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
      </div>
    </div>
  </div>
`
app.appendChild(toolbar)

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

  const r = await graph.execute()
  if (!r.ok) console.error(r.error)

  await new Promise(r => setTimeout(r, 2000))
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
  } else {
    document.body.classList.remove('popover-open')
  }
  if (!settingsPopover.hidden) {
    settingsMenuItems.forEach(el => {
      el.classList.toggle('active', graph.noodleStyle === el.dataset.noodleStyle)
    })
  }
})

settingsMenuItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const style = btn.dataset.noodleStyle
    graph.setNoodleStyle(style)
    settingsMenuItems.forEach(el => el.classList.toggle('active', el.dataset.noodleStyle === style))
  })
})

document.addEventListener('click', (e) => {
  if (!settingsWrap.contains(e.target)) closeSettingsPopover()
})
