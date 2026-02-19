/**
 * Creates a boolean toggle widget. Used by BoolNode, InputWidget, settings, etc.
 * @param {Object} nodeOrState - Node to bind to, or state object { [valueKey]: boolean }
 * @param {Object} options
 * @param {string} [options.label] - Label text
 * @param {string} [options.valueKey='booleanValue'] - Property to read/write
 * @param {Function} [options.onChange] - Called after value changes
 * @param {string} [options.tooltip] - Tooltip text (wraps toggle in widget-tooltip container)
 * @returns {HTMLElement}
 */
export function createBooleanWidget(nodeOrState, options = {}) {
  const node = nodeOrState ?? {}
  const valueKey = options.valueKey ?? 'booleanValue'
  if (node[valueKey] === undefined) node[valueKey] = false

  const wrap = document.createElement('div')
  wrap.className = 'widget-boolean widget-row'
  if (options.label) {
    const labelEl = document.createElement('span')
    labelEl.className = 'widget-label'
    labelEl.textContent = options.label
    wrap.appendChild(labelEl)
  }

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'widget-boolean-toggle'
  btn.setAttribute('role', 'switch')
  btn.setAttribute('aria-checked', node[valueKey])
  const track = document.createElement('span')
  track.className = 'widget-boolean-track'
  const knob = document.createElement('span')
  knob.className = 'widget-boolean-knob'
  track.appendChild(knob)
  btn.appendChild(track)

  const update = () => {
    const val = node[valueKey]
    btn.classList.toggle('on', val)
    btn.setAttribute('aria-checked', val)
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    node[valueKey] = !node[valueKey]
    update()
    options.onChange?.()
  })
  btn.addEventListener('mousedown', (e) => e.stopPropagation())
  btn.addEventListener('pointerdown', (e) => e.stopPropagation())

  if (options.tooltip) {
    const tooltipWrap = document.createElement('div')
    tooltipWrap.className = 'widget-tooltip-wrap'
    const tooltip = document.createElement('div')
    tooltip.className = 'widget-tooltip'
    tooltip.textContent = options.tooltip
    tooltipWrap.appendChild(btn)
    tooltipWrap.appendChild(tooltip)
    wrap.appendChild(tooltipWrap)
  } else {
    wrap.appendChild(btn)
  }
  update()
  return wrap
}
