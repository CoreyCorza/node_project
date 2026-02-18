import { getNoodleTypeClass, needsGradient, getGradientColors } from '../socket-types.js'

let noodleIdCounter = 0

export class Noodle {
  constructor(graph, fromSocket, toSocket = null) {
    this.graph = graph
    this.fromSocket = fromSocket
    this.toSocket = toSocket
    this.el = null
    this.gradientId = `noodle-grad-${++noodleIdCounter}`
  }

  createElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const typeClass = getNoodleTypeClass(this.fromSocket?.dataType ?? this.toSocket?.dataType ?? 'default')
    svg.setAttribute('class', `noodle ${typeClass}`)
    svg.setAttribute('overflow', 'visible')
    svg.style.position = 'absolute'
    svg.style.left = '0'
    svg.style.top = '0'
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    grad.setAttribute('id', this.gradientId)
    grad.setAttribute('gradientUnits', 'userSpaceOnUse')
    grad.innerHTML = '<stop offset="0%" stop-color="#9ae04a"/><stop offset="100%" stop-color="#a149db"/>'
    defs.appendChild(grad)
    svg.appendChild(defs)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-width', '2')
    path.setAttribute('stroke-linecap', 'round')
    svg.appendChild(path)
    this.pathEl = path
    this.gradientEl = grad
    this.el = svg
    return svg
  }

  updatePath(endX = null, endY = null, snapSocket = null) {
    const toGraph = (clientX, clientY) => this.graph.getGraphCoords(clientX, clientY)

    let from, to
    if (this.fromSocket?.el) {
      from = this.fromSocket.getCenter()
      if (!from) return
      if (this.toSocket) {
        to = this.toSocket.getCenter()
      } else if (snapSocket) {
        to = snapSocket.getCenter()
      } else if (endX != null && endY != null) {
        to = toGraph(endX, endY)
      }
    } else if (this.toSocket?.el) {
      to = this.toSocket.getCenter()
      if (!to) return
      if (snapSocket) {
        from = snapSocket.getCenter()
      } else if (endX != null && endY != null) {
        from = toGraph(endX, endY)
      }
    }
    if (!this.pathEl || !from || !to) return

    const linear = this.graph.noodleStyle === 'linear'
    let d
    if (linear) {
      const flatLen = 20
      const dist = Math.hypot(to.x - from.x, to.y - from.y)
      const isDragging = !this.fromSocket || !this.toSocket
      const effectiveFlatLen = isDragging
        ? Math.min(flatLen, Math.max(dist * 0.25, 2))
        : flatLen
      const fromOut = this.fromSocket?.type === 'output' ? effectiveFlatLen : -effectiveFlatLen
      const toIn = this.toSocket?.type === 'input' ? -effectiveFlatLen : effectiveFlatLen
      let flatFrom = this.fromSocket ? { x: from.x + fromOut, y: from.y } : null
      let flatTo = this.toSocket ? { x: to.x + toIn, y: to.y } : null
      if (!flatFrom && this.toSocket) {
        const dir = Math.sign(to.x - from.x) || 1
        flatFrom = { x: from.x + dir * effectiveFlatLen, y: from.y }
      }
      if (!flatTo && this.fromSocket) {
        const dir = Math.sign(from.x - to.x) || 1
        flatTo = { x: to.x + dir * effectiveFlatLen, y: to.y }
      }
      if (flatFrom && flatTo) {
        d = `M ${from.x} ${from.y} L ${flatFrom.x} ${flatFrom.y} L ${flatTo.x} ${flatTo.y} L ${to.x} ${to.y}`
      } else if (flatFrom) {
        d = `M ${from.x} ${from.y} L ${flatFrom.x} ${flatFrom.y} L ${to.x} ${to.y}`
      } else if (flatTo) {
        d = `M ${from.x} ${from.y} L ${flatTo.x} ${flatTo.y} L ${to.x} ${to.y}`
      } else {
        d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
      }
    } else {
      const dx = to.x - from.x
      const dist = Math.hypot(dx, to.y - from.y)
      const curveOffset = Math.min(80, Math.max(dist * 0.5, 12))
      const span = Math.max(Math.abs(dx) * 0.5, 20)
      const offset = Math.min(curveOffset, span)
      const isDragging = !this.toSocket
      const fromIsCursor = !this.fromSocket?.el
      const toIsCursor = !this.toSocket?.el
      let fromOut, toIn
      if (fromIsCursor) {
        fromOut = this.toSocket?.type === 'input' ? offset : -offset
        toIn = this.toSocket?.type === 'input' ? -offset : offset
      } else if (toIsCursor) {
        fromOut = this.fromSocket?.type === 'output' ? offset : -offset
        toIn = this.fromSocket?.type === 'input' ? offset : -offset
      } else {
        fromOut = this.fromSocket?.type === 'output' ? offset : -offset
        toIn = this.toSocket?.type === 'input' ? -offset : offset
      }
      const cp1x = from.x + fromOut
      let cp2x = to.x + toIn
      if (this.fromSocket && this.toSocket && Math.abs(dx) < curveOffset * 2) {
        if (this.fromSocket.type === 'output' && this.toSocket.type === 'input' && cp2x < from.x) {
          cp2x = from.x + span
        } else if (this.fromSocket.type === 'input' && this.toSocket.type === 'output' && cp2x > from.x) {
          cp2x = from.x - span
        }
      }
      d = `M ${from.x} ${from.y} C ${cp1x} ${from.y}, ${cp2x} ${to.y}, ${to.x} ${to.y}`
    }
    this.pathEl.setAttribute('d', d)

    const minX = Math.min(from.x, to.x) - 20
    const minY = Math.min(from.y, to.y) - 20
    const w = Math.abs(to.x - from.x) + 40
    const h = Math.abs(to.y - from.y) + 40
    this.el.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`)
    this.el.setAttribute('width', w)
    this.el.setAttribute('height', h)
    this.el.style.left = `${minX}px`
    this.el.style.top = `${minY}px`

    if (this.gradientEl && needsGradient(this.fromSocket, this.toSocket)) {
      this.gradientEl.setAttribute('x1', from.x)
      this.gradientEl.setAttribute('y1', from.y)
      this.gradientEl.setAttribute('x2', to.x)
      this.gradientEl.setAttribute('y2', to.y)
    }
  }

  setPreview(v) {
    if (!this.el) return
    const cls = (this.el.getAttribute('class') || '').replace(/\s*preview\s*/g, ' ').trim()
    this.el.setAttribute('class', v ? `${cls} preview`.trim() : cls || 'noodle')
  }

  updateColor() {
    if (!this.el) return
    const useGradient = needsGradient(this.fromSocket, this.toSocket)
    const cls = (this.el.getAttribute('class') || '').replace(/\bnoodle-type-\w+\b/g, '').trim()
    if (useGradient) {
      const [c1, c2] = getGradientColors(this.fromSocket, this.toSocket)
      const stops = this.gradientEl.querySelectorAll('stop')
      if (stops[0]) stops[0].setAttribute('stop-color', c1)
      if (stops[1]) stops[1].setAttribute('stop-color', c2)
      this.pathEl.setAttribute('stroke', `url(#${this.gradientId})`)
      this.el.setAttribute('class', cls)
    } else {
      this.pathEl.removeAttribute('stroke')
      const typeClass = getNoodleTypeClass(this.toSocket?.dataType ?? this.fromSocket?.dataType ?? 'default')
      this.el.setAttribute('class', `${cls} ${typeClass}`.trim())
    }
  }

  remove() {
    this.fromSocket?.removeConnection(this)
    this.toSocket?.removeConnection(this)
    this.el?.remove()
    this.graph.noodles = this.graph.noodles.filter(n => n !== this)
  }
}
