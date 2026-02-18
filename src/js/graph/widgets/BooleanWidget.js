export function createBooleanWidget(node, options = {}) {
  if (node.booleanValue === undefined) node.booleanValue = false
  const wrap = document.createElement('div')
  wrap.className = 'widget-boolean'
  if (options.label) {
    const labelEl = document.createElement('span')
    labelEl.className = 'widget-boolean-label'
    labelEl.textContent = options.label
    wrap.appendChild(labelEl)
  }
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'widget-boolean-toggle'
  btn.setAttribute('role', 'switch')
  btn.setAttribute('aria-checked', node.booleanValue)
  const track = document.createElement('span')
  track.className = 'widget-boolean-track'
  const knob = document.createElement('span')
  knob.className = 'widget-boolean-knob'
  track.appendChild(knob)
  btn.appendChild(track)
  const update = () => {
    btn.classList.toggle('on', node.booleanValue)
    btn.setAttribute('aria-checked', node.booleanValue)
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    node.booleanValue = !node.booleanValue
    update()
  })
  wrap.appendChild(btn)
  update()
  return wrap
}
