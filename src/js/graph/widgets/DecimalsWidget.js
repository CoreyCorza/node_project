/**
 * Decimals precision selector. Scroll to change value 0-6.
 * @param {Object} node - Node/state to bind to
 * @param {Object} options
 * @param {string} [options.label='decimals'] - Label text
 * @param {string} [options.valueKey='floatDecimals'] - Property to read/write
 * @param {Function} [options.onChange] - Called after value changes
 */
export function createDecimalsWidget(node, options = {}) {
  const valueKey = options.valueKey ?? 'floatDecimals'
  if (node[valueKey] === undefined) node[valueKey] = 2

  const wrap = document.createElement('div')
  wrap.className = 'widget-decimals widget-row'

  const label = document.createElement('span')
  label.className = 'widget-label'
  label.textContent = options.label ?? 'decimals'
  wrap.appendChild(label)

  const displayWrap = document.createElement('div')
  displayWrap.className = 'widget-tooltip-wrap'
  const display = document.createElement('div')
  display.className = 'widget-decimals-display'
  display.textContent = String(node[valueKey])

  const tooltip = document.createElement('div')
  tooltip.className = 'widget-tooltip'
  tooltip.textContent = 'Ctrl + Scroll'
  displayWrap.appendChild(display)
  displayWrap.appendChild(tooltip)

  display.addEventListener('wheel', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const dir = e.deltaY < 0 ? 1 : -1
    const newVal = Math.max(0, Math.min(6, node[valueKey] + dir))
    if (newVal !== node[valueKey]) {
      node[valueKey] = newVal
      display.textContent = String(newVal)
      options.onChange?.()
    }
  }, { passive: false })
  display.addEventListener('mousedown', (e) => e.stopPropagation())
  display.addEventListener('pointerdown', (e) => e.stopPropagation())

  wrap.appendChild(displayWrap)

  wrap.refresh = () => {
    display.textContent = String(node[valueKey])
  }

  return wrap
}
