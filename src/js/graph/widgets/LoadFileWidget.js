import { open } from '@tauri-apps/plugin-dialog'

export function createLoadFileWidget(node) {
  if (node.selectedFilePath === undefined) node.selectedFilePath = ''
  const wrap = document.createElement('div')
  wrap.className = 'node-widget-load-file'
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'node-widget-btn node-widget-btn-icon'
  btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
  btn.title = 'Select file'
  const pathEl = document.createElement('div')
  pathEl.className = 'node-widget-path'
  const update = () => {
    pathEl.textContent = node.selectedFilePath || ''
    pathEl.title = node.selectedFilePath || ''
  }
  btn.addEventListener('click', async (e) => {
    e.stopPropagation()
    const path = await open({ multiple: false, directory: false, filters: [{ name: 'Text', extensions: ['txt'] }] })
    if (path) {
      node.selectedFilePath = typeof path === 'string' ? path : path.path ?? path
      update()
    }
  })
  wrap.appendChild(btn)
  wrap.appendChild(pathEl)
  update()
  return wrap
}
