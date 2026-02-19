/**
 * Integer input with scrub. Used by Input widget (integer mode), IntegerNode, etc.
 * @param {Object} node - Node/state to bind to
 * @param {Object} options
 * @param {string} [options.label] - Label text
 * @param {string} [options.valueKey='inputValue'] - Property to read/write (or 'intValue' for IntegerNode)
 */
export function createIntegerWidget(node, options = {}) {
  const valueKey = options.valueKey ?? 'inputValue'
  if (node[valueKey] === undefined) node[valueKey] = '0'

  const wrap = document.createElement('div')
  wrap.className = 'widget-integer widget-row'
  if (options.label) {
    const labelEl = document.createElement('span')
    labelEl.className = 'widget-label'
    labelEl.textContent = options.label
    wrap.appendChild(labelEl)
  }

  const input = document.createElement('input')
  input.type = 'number'
  input.step = '1'
  input.className = 'widget-integer-field'
  input.value = String(Math.round(parseFloat(node[valueKey]) || 0))
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node[valueKey] = input.value
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      input.blur()
    }
  })
  input.addEventListener('blur', () => {
    const val = Math.round(parseFloat(node[valueKey]) || 0)
    node[valueKey] = String(val)
    input.value = String(val)
    scrubEl.textContent = String(val)
    input.style.display = 'none'
    scrubEl.style.display = ''
  })
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())

  const scrubEl = document.createElement('div')
  scrubEl.className = 'widget-integer-scrub'
  scrubEl.textContent = input.value

  let dragging = false
  let startX = 0
  let startValue = 0
  let hasMoved = false

  scrubEl.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    e.preventDefault()
    dragging = true
    hasMoved = false
    startX = e.clientX
    startValue = Math.round(parseFloat(node[valueKey]) || 0)
    scrubEl.classList.add('scrubbing')
    document.body.style.cursor = 'ew-resize'

    const onMove = (ev) => {
      if (!dragging) return
      const dx = ev.clientX - startX
      if (Math.abs(dx) > 2) hasMoved = true
      const newVal = startValue + Math.round(dx)
      node[valueKey] = String(newVal)
      input.value = String(newVal)
      scrubEl.textContent = String(newVal)
    }

    const onUp = () => {
      dragging = false
      scrubEl.classList.remove('scrubbing')
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (!hasMoved) {
        input.style.display = ''
        scrubEl.style.display = 'none'
        input.focus()
        input.select()
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  const fieldWrap = document.createElement('div')
  fieldWrap.className = 'widget-integer-field-wrap'
  fieldWrap.appendChild(scrubEl)
  fieldWrap.appendChild(input)
  input.style.display = 'none'
  wrap.appendChild(fieldWrap)

  return wrap
}
