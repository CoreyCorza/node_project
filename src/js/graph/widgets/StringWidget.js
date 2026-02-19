export function createStringWidget(node, options = {}) {
  const valueKey = options.valueKey ?? 'stringValue'
  if (node[valueKey] === undefined) node[valueKey] = options.defaultValue ?? ''

  const wrap = document.createElement('div')
  wrap.className = 'widget-string widget-row'
  if (options.label) {
    const labelEl = document.createElement('span')
    labelEl.className = 'widget-label'
    labelEl.textContent = options.label
    wrap.appendChild(labelEl)
  }

  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'widget-string-field'
  input.value = node[valueKey]
  input.placeholder = options.placeholder ?? ''
  input.autocomplete = 'off'
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node[valueKey] = input.value
    options.onChange?.()
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      input.blur()
    }
  })
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())
  wrap.appendChild(input)

  return wrap
}
