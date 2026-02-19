/**
 * Reusable dropdown selector.
 * @param {Object} options
 * @param {Array<{value: string, label: string}>} options.items - Dropdown options
 * @param {string} options.value - Currently selected value
 * @param {Function} options.onChange - Called with new value on selection
 * @param {Object} [options.trackEl] - Element whose transforms to follow (for repositioning)
 */
export function createDropdownWidget(options = {}) {
  const { items = [], value, onChange, trackEl } = options

  const wrap = document.createElement('div')
  wrap.className = 'widget-dropdown'

  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.className = 'widget-dropdown-trigger'
  trigger.textContent = items.find(t => t.value === value)?.label ?? items[0]?.label ?? ''

  const menu = document.createElement('div')
  menu.className = 'widget-dropdown-menu'
  menu.hidden = true

  for (const item of items) {
    const el = document.createElement('div')
    el.className = 'widget-dropdown-item'
    el.textContent = item.label
    el.dataset.value = item.value
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      trigger.textContent = item.label
      close()
      onChange?.(item.value)
    })
    menu.appendChild(el)
  }

  let transformCleanup = null

  function close() {
    if (menu.hidden) return
    menu.hidden = true
    document.body.classList.remove('popover-open')
    wrap.appendChild(menu)
    document.removeEventListener('click', close)
    transformCleanup?.()
    transformCleanup = null
  }

  function reposition() {
    const rect = trigger.getBoundingClientRect()
    menu.style.left = `${rect.left}px`
    menu.style.top = `${rect.bottom + 2}px`
    menu.style.minWidth = `${rect.width - 10}px`
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    const opening = menu.hidden
    menu.hidden = !opening
    document.body.classList.toggle('popover-open', opening)
    if (opening) {
      reposition()
      document.body.appendChild(menu)
      let rafId = null
      const rafLoop = () => {
        if (!menu.hidden) {
          reposition()
          rafId = requestAnimationFrame(rafLoop)
        }
      }
      rafId = requestAnimationFrame(rafLoop)
      const onTransform = () => reposition()
      trackEl?.addEventListener('graphtransform', onTransform)
      transformCleanup = () => {
        trackEl?.removeEventListener('graphtransform', onTransform)
        if (rafId != null) cancelAnimationFrame(rafId)
      }
      setTimeout(() => document.addEventListener('click', close), 0)
    } else {
      wrap.appendChild(menu)
      document.removeEventListener('click', close)
      transformCleanup?.()
      transformCleanup = null
    }
  })

  wrap.addEventListener('mousedown', (e) => e.stopPropagation())
  wrap.addEventListener('pointerdown', (e) => e.stopPropagation())
  wrap.appendChild(trigger)
  wrap.appendChild(menu)

  wrap.setValue = (val) => {
    trigger.textContent = items.find(t => t.value === val)?.label ?? ''
  }

  return wrap
}
