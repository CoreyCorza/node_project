export function createColorWidget(node, options = {}) {
  const valueKey = options.valueKey ?? 'colorValue'
  if (node[valueKey] === undefined) node[valueKey] = options.defaultValue ?? '#000000'

  const wrap = document.createElement('div')
  wrap.className = 'widget-color widget-row'

  const label = document.createElement('span')
  label.className = 'widget-label'
  label.textContent = 'color'
  wrap.appendChild(label)

  const picker = document.createElement('input')
  picker.type = 'color'
  picker.className = 'widget-color-picker'
  picker.value = node[valueKey]
  picker.addEventListener('input', (e) => {
    e.stopPropagation()
    node[valueKey] = picker.value
    hexLabel.textContent = picker.value
    options.onChange?.()
  })
  picker.addEventListener('change', () => {
    node.graph?.save?.()
  })
  picker.addEventListener('mousedown', (e) => e.stopPropagation())
  picker.addEventListener('pointerdown', (e) => e.stopPropagation())
  wrap.appendChild(picker)

  const hexLabel = document.createElement('span')
  hexLabel.className = 'widget-color-hex'
  hexLabel.textContent = node[valueKey]
  wrap.appendChild(hexLabel)

  return wrap
}
