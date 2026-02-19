export function createFloatWidget(node, options = {}) {
  if (node.floatValue === undefined) node.floatValue = options.defaultValue ?? 0
  const wrap = document.createElement('div')
  wrap.className = 'widget-float'
  if (options.label) {
    const labelEl = document.createElement('span')
    labelEl.className = 'widget-float-label'
    labelEl.textContent = options.label
    wrap.appendChild(labelEl)
  }
  const input = document.createElement('input')
  input.type = 'number'
  input.className = 'widget-float-input'
  input.value = node.floatValue
  input.step = options.step ?? 0.1
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node.floatValue = parseFloat(input.value) || 0
  })
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())
  wrap.appendChild(input)
  return wrap
}
