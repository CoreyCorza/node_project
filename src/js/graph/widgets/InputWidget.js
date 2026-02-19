import { getSocketTypeClass, canConnect } from '../socket-types.js'

const INPUT_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'float', label: 'Float' },
  { value: 'integer', label: 'Integer' },
  { value: 'bool', label: 'Bool' },
]

function formatNumber(value, type, round, decimals) {
  const num = parseFloat(value)
  if (isNaN(num)) return type === 'float' ? (0).toFixed(decimals) : '0'
  if (type === 'integer') return String(Math.round(num))
  return num.toFixed(decimals)
}

function createBoolToggle(node) {
  if (node.booleanValue === undefined) node.booleanValue = false
  const row = document.createElement('div')
  row.className = 'widget-input-bool-row'
  const label = document.createElement('span')
  label.className = 'widget-input-bool-label'
  label.textContent = 'value'
  row.appendChild(label)
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
  btn.addEventListener('mousedown', (e) => e.stopPropagation())
  btn.addEventListener('pointerdown', (e) => e.stopPropagation())
  const boolWrap = document.createElement('div')
  boolWrap.className = 'widget-input-decimals-wrap'
  const boolTooltip = document.createElement('div')
  boolTooltip.className = 'widget-tooltip'
  boolTooltip.textContent = 'Toggle true / false'
  boolWrap.appendChild(btn)
  boolWrap.appendChild(boolTooltip)
  row.appendChild(boolWrap)
  update()
  return row
}

function createDecimalsInput(node, onChange) {
  if (node.floatDecimals === undefined) node.floatDecimals = 2
  const row = document.createElement('div')
  row.className = 'widget-input-bool-row'
  const label = document.createElement('span')
  label.className = 'widget-input-bool-label'
  label.textContent = 'decimals'
  row.appendChild(label)
  const displayWrap = document.createElement('div')
  displayWrap.className = 'widget-input-decimals-wrap'
  const display = document.createElement('div')
  display.className = 'widget-input-decimals-display'
  display.textContent = String(node.floatDecimals)
  const tooltip = document.createElement('div')
  tooltip.className = 'widget-tooltip'
  tooltip.textContent = 'Ctrl + Scroll'
  displayWrap.appendChild(display)
  displayWrap.appendChild(tooltip)
  display.addEventListener('wheel', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const dir = e.deltaY < 0 ? 1 : -1
    const newVal = Math.max(0, Math.min(6, node.floatDecimals + dir))
    if (newVal !== node.floatDecimals) {
      node.floatDecimals = newVal
      display.textContent = String(newVal)
      if (onChange) onChange()
    }
  }, { passive: false })
  display.addEventListener('mousedown', (e) => e.stopPropagation())
  display.addEventListener('pointerdown', (e) => e.stopPropagation())
  row.appendChild(displayWrap)
  return row
}

function createRoundToggle(node, onChange) {
  if (node.floatRound === undefined) node.floatRound = false
  const row = document.createElement('div')
  row.className = 'widget-input-bool-row'
  const label = document.createElement('span')
  label.className = 'widget-input-bool-label'
  label.textContent = 'round'
  row.appendChild(label)
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'widget-boolean-toggle'
  btn.setAttribute('role', 'switch')
  btn.setAttribute('aria-checked', node.floatRound)
  const track = document.createElement('span')
  track.className = 'widget-boolean-track'
  const knob = document.createElement('span')
  knob.className = 'widget-boolean-knob'
  track.appendChild(knob)
  btn.appendChild(track)
  const update = () => {
    btn.classList.toggle('on', node.floatRound)
    btn.setAttribute('aria-checked', node.floatRound)
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    node.floatRound = !node.floatRound
    update()
    if (onChange) onChange()
  })
  btn.addEventListener('mousedown', (e) => e.stopPropagation())
  btn.addEventListener('pointerdown', (e) => e.stopPropagation())
  const toggleWrap = document.createElement('div')
  toggleWrap.className = 'widget-input-decimals-wrap'
  const toggleTooltip = document.createElement('div')
  toggleTooltip.className = 'widget-tooltip'
  toggleTooltip.textContent = 'Enable custom decimals'
  toggleWrap.appendChild(btn)
  toggleWrap.appendChild(toggleTooltip)
  row.appendChild(toggleWrap)
  update()
  return row
}

function setupNumberScrub(scrubEl, input, node) {
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
    startValue = parseFloat(node.inputValue) || 0
    scrubEl.classList.add('scrubbing')
    document.body.style.cursor = 'ew-resize'

    const onMove = (ev) => {
      if (!dragging) return
      const dx = ev.clientX - startX
      if (Math.abs(dx) > 2) hasMoved = true
      const isFloat = node.inputDataType === 'float'
      const sensitivity = isFloat ? 0.1 : 1
      let newVal = startValue + dx * sensitivity
      if (!isFloat) newVal = Math.round(newVal)
      node.inputValue = String(newVal)
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const decimals = node.floatDecimals ?? 2
        const formatted = formatNumber(newVal, node.inputDataType, node.floatRound, decimals)
        input.value = formatted
        scrubEl.textContent = formatted
        rafId = null
      })
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
}

export function createInputWidget(node) {
  if (node.inputValue === undefined) node.inputValue = ''
  if (node.inputDataType === undefined) node.inputDataType = 'string'

  const wrap = document.createElement('div')
  wrap.className = 'widget-input'

  // Type dropdown
  const select = document.createElement('select')
  select.className = 'widget-input-select'
  for (const t of INPUT_TYPES) {
    const opt = document.createElement('option')
    opt.value = t.value
    opt.textContent = t.label
    if (t.value === node.inputDataType) opt.selected = true
    select.appendChild(opt)
  }
  select.addEventListener('mousedown', (e) => e.stopPropagation())
  select.addEventListener('pointerdown', (e) => e.stopPropagation())
  wrap.appendChild(select)

  // Value controls container
  const controlsWrap = document.createElement('div')
  controlsWrap.className = 'widget-input-controls'
  wrap.appendChild(controlsWrap)

  // Text/number input (hidden when scrub overlay is active)
  const input = document.createElement('input')
  input.className = 'widget-input-field'
  input.value = node.inputValue
  input.addEventListener('input', (e) => {
    e.stopPropagation()
    node.inputValue = input.value
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      input.blur()
    }
  })
  input.addEventListener('mousedown', (e) => e.stopPropagation())
  input.addEventListener('pointerdown', (e) => e.stopPropagation())

  // Scrub overlay for number types
  const scrubEl = document.createElement('div')
  scrubEl.className = 'widget-input-scrub'
  setupNumberScrub(scrubEl, input, node)

  // When input loses focus, switch back to scrub display
  input.addEventListener('blur', () => {
    if (node.inputDataType === 'float' || node.inputDataType === 'integer') {
      const decimals = node.floatDecimals ?? 2
      const formatted = formatNumber(node.inputValue, node.inputDataType, node.floatRound, decimals)
      node.inputValue = String(parseFloat(node.inputValue) || 0)
      input.value = formatted
      scrubEl.textContent = formatted
      input.style.display = 'none'
      scrubEl.style.display = ''
    }
  })

  // Bool toggle
  const boolToggle = createBoolToggle(node)

  // Round toggle + decimals input for float mode
  function refreshDisplay() {
    // Reset decimals to default when round is toggled off
    if (!node.floatRound) {
      node.floatDecimals = 2
      decimalsInput.querySelector('.widget-input-decimals-display').textContent = '2'
    }
    const decimals = node.floatDecimals ?? 2
    const formatted = formatNumber(node.inputValue, node.inputDataType, node.floatRound, decimals)
    input.value = formatted
    scrubEl.textContent = formatted
    // Show/hide decimals input based on round state
    decimalsInput.style.display = node.floatRound ? '' : 'none'
  }
  const decimalsInput = createDecimalsInput(node, refreshDisplay)
  const roundToggle = createRoundToggle(node, refreshDisplay)

  function applyType(type, isInit) {
    node.inputDataType = type
    controlsWrap.innerHTML = ''
    // Reset value when switching types (but not on initial load)
    if (!isInit) {
      if (type === 'float' || type === 'integer') {
        node.inputValue = '0'
      } else if (type === 'string') {
        node.inputValue = ''
      }
    }
    if (type === 'bool') {
      controlsWrap.appendChild(boolToggle)
    } else if (type === 'float' || type === 'integer') {
      input.type = 'number'
      input.step = type === 'float' ? '0.1' : '1'
      if (!node.inputValue && node.inputValue !== '0') node.inputValue = '0'
      const decimals = node.floatDecimals ?? 2
      const formatted = formatNumber(node.inputValue, type, node.floatRound, decimals)
      input.value = formatted
      scrubEl.textContent = formatted
      input.style.display = 'none'
      scrubEl.style.display = ''
      controlsWrap.appendChild(scrubEl)
      controlsWrap.appendChild(input)
      if (type === 'float') {
        controlsWrap.appendChild(roundToggle)
        decimalsInput.style.display = node.floatRound ? '' : 'none'
        controlsWrap.appendChild(decimalsInput)
      }
    } else {
      input.type = 'text'
      input.placeholder = 'enter value...'
      input.value = node.inputValue
      input.style.display = ''
      scrubEl.style.display = 'none'
      controlsWrap.appendChild(input)
    }
    // Update the output socket
    const outSocket = node.outputs[0]
    if (outSocket) {
      const oldClass = getSocketTypeClass(outSocket.dataType)
      outSocket.dataType = type
      const newClass = getSocketTypeClass(type)
      if (outSocket.el) {
        outSocket.el.classList.remove(oldClass)
        outSocket.el.classList.add(newClass)
        outSocket.el.dataset.socketDataType = type
      }
      // Reconnect, disconnect, or update color for each connection
      if (outSocket.connections) {
        for (const noodle of [...outSocket.connections]) {
          const target = noodle.toSocket
          if (target && !canConnect(outSocket, target)) {
            // Try to find a compatible input on the same target node
            const targetNode = target.node
            const newTarget = targetNode?.inputs.find(s =>
              s !== target &&
              s.connections.length === 0 &&
              canConnect(outSocket, s)
            )
            if (newTarget) {
              // Rewire: detach from old socket, attach to new one
              target.removeConnection(noodle)
              noodle.toSocket = newTarget
              newTarget.addConnection(noodle)
              noodle.updatePath()
              noodle.updateColor()
            } else {
              noodle.remove()
            }
          } else {
            noodle.updateColor()
          }
        }
      }
    }
  }

  select.addEventListener('change', (e) => {
    e.stopPropagation()
    applyType(select.value, false)
  })

  applyType(node.inputDataType, true)

  return wrap
}
