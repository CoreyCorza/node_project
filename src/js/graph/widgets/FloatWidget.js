export function createFloatWidget(node, options = {}) {
  const valueKey = options.valueKey ?? 'floatValue'
  if (node[valueKey] === undefined) node[valueKey] = options.defaultValue ?? 0

  const wrap = document.createElement('div')
  wrap.className = 'widget-float widget-row'
  if (options.label) {
    const labelEl = document.createElement('span')
    labelEl.className = 'widget-label'
    labelEl.textContent = options.label
    wrap.appendChild(labelEl)
  }

  const step = options.step ?? 0.1
  const getDecimals = () => options.getDecimals?.() ?? 2
  const getRound = () => options.getRound?.() ?? false

  function format(val) {
    const num = parseFloat(val)
    if (isNaN(num)) return (0).toFixed(getDecimals())
    if (getRound()) return num.toFixed(getDecimals())
    return num.toFixed(getDecimals())
  }

  const input = document.createElement('input')
  input.type = 'number'
  input.step = String(step)
  input.className = 'widget-float-field'
  input.value = format(node[valueKey])
  input.autocomplete = 'off'
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node[valueKey] = parseFloat(input.value) || 0
    options.onChange?.()
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      input.blur()
    }
  })
  input.addEventListener('blur', () => {
    const val = parseFloat(node[valueKey]) || 0
    node[valueKey] = val
    const formatted = format(val)
    input.value = formatted
    scrubEl.textContent = formatted
    input.style.display = 'none'
    scrubEl.style.display = ''
    node.graph?.save?.()
  })
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())

  const scrubEl = document.createElement('div')
  scrubEl.className = 'widget-float-scrub'
  scrubEl.textContent = format(node[valueKey])

  let dragging = false
  let startX = 0
  let startValue = 0
  let hasMoved = false
  let rafId = null

  scrubEl.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    e.preventDefault()
    dragging = true
    hasMoved = false
    startX = e.clientX
    startValue = parseFloat(node[valueKey]) || 0
    scrubEl.classList.add('scrubbing')
    document.body.style.cursor = 'ew-resize'

    const onMove = (ev) => {
      if (!dragging) return
      const dx = ev.clientX - startX
      if (Math.abs(dx) > 2) hasMoved = true
      const newVal = startValue + dx * step
      node[valueKey] = newVal
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const formatted = format(newVal)
        input.value = formatted
        scrubEl.textContent = formatted
        rafId = null
      })
      options.onChange?.()
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
      } else {
        node.graph?.save?.()
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  const fieldWrap = document.createElement('div')
  fieldWrap.className = 'widget-float-field-wrap'
  fieldWrap.appendChild(scrubEl)
  fieldWrap.appendChild(input)
  input.style.display = 'none'
  wrap.appendChild(fieldWrap)

  wrap.refresh = () => {
    const formatted = format(node[valueKey])
    input.value = formatted
    scrubEl.textContent = formatted
  }

  return wrap
}
