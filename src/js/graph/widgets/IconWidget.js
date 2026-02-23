import { open } from '@tauri-apps/plugin-dialog'

export function createIconWidget(node) {
  if (node.iconFilePath === undefined) node.iconFilePath = ''

  const wrap = document.createElement('div')
  wrap.className = 'widget-icon'

  const toolbar = document.createElement('div')
  toolbar.className = 'widget-icon-toolbar'

  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'widget-icon-input'
  input.placeholder = 'favicon path...'
  input.value = node.iconFilePath
  input.autocomplete = 'off'
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node.iconFilePath = input.value
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.stopPropagation(); input.blur() }
  })
  input.addEventListener('blur', () => node.graph?.save?.())
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'node-widget-btn node-widget-btn-icon'
  btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
  btn.title = 'Select icon file'
  btn.addEventListener('click', async (e) => {
    e.stopPropagation()
    const path = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Icons', extensions: ['ico', 'png', 'svg', 'gif', 'webp'] }]
    })
    if (path) {
      node.iconFilePath = typeof path === 'string' ? path : path.path ?? path
      input.value = node.iconFilePath
      node.graph?.save?.()
    }
  })

  toolbar.appendChild(input)
  toolbar.appendChild(btn)
  wrap.appendChild(toolbar)

  return wrap
}
