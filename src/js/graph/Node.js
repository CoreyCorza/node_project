import { Socket } from './Socket.js'

export class Node {
  constructor(graph, id, title, x = 0, y = 0, width = 180, height = 0, options = {}) {
    this.graph = graph
    this.id = id
    this.title = title
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.resizableW = options.resizableW ?? true
    this.resizableH = options.resizableH ?? false
    this.nodeTypeId = options.nodeTypeId ?? null
    this.computeFn = options.computeFn ?? null
    this.createWidget = options.createWidget ?? null
    this.afterExecute = options.afterExecute ?? null
    this.inputs = []
    this.outputs = []
    this.el = null
  }

  compute(inputs) {
    if (this.computeFn) return this.computeFn(inputs)
    const out = {}
    const firstInput = Object.values(inputs)[0]
    for (const s of this.outputs) out[s.id] = firstInput
    return out
  }

  createElement() {
    const el = document.createElement('div')
    el.className = 'node'
    el.dataset.nodeId = this.id
    if (this.nodeTypeId) el.dataset.nodeType = this.nodeTypeId
    el.style.left = `${this.x}px`
    el.style.top = `${this.y}px`
    el.style.width = `${this.width}px`
    if (this.height > 0) el.style.height = `${this.height}px`

    const header = document.createElement('div')
    header.className = 'node-header'
    header.textContent = this.title
    el.appendChild(header)

    const body = document.createElement('div')
    body.className = 'node-body'

    const socketsRow = document.createElement('div')
    socketsRow.className = 'node-sockets-row'

    const inputsWrap = document.createElement('div')
    inputsWrap.className = 'node-sockets inputs'
    this.inputs.forEach(s => inputsWrap.appendChild(s.createElement()))
    socketsRow.appendChild(inputsWrap)

    const dragZone = document.createElement('div')
    dragZone.className = 'node-drag-zone'
    socketsRow.appendChild(dragZone)

    const outputsWrap = document.createElement('div')
    outputsWrap.className = 'node-sockets outputs'
    this.outputs.forEach(s => outputsWrap.appendChild(s.createElement()))
    socketsRow.appendChild(outputsWrap)

    body.appendChild(socketsRow)

    if (this.createWidget) {
      const widgetSection = document.createElement('div')
      widgetSection.className = 'node-widget-section'
      const widgetWrap = document.createElement('div')
      widgetWrap.className = 'node-widget'
      widgetWrap.appendChild(this.createWidget(this))
      widgetSection.appendChild(widgetWrap)
      body.appendChild(widgetSection)
    }

    el.appendChild(body)

    const resizeHandle = document.createElement('div')
    resizeHandle.className = 'node-resize-handle'
    el.appendChild(resizeHandle)
    this.el = el
    return el
  }

  setPosition(x, y) {
    this.x = x
    this.y = y
    if (this.el) {
      this.el.style.left = `${x}px`
      this.el.style.top = `${y}px`
    }
  }

  getMinSize() {
    if (!this.el) return { width: 120, height: 80 }
    const prevW = this.el.style.width
    const prevH = this.el.style.height
    this.el.style.width = ''
    this.el.style.height = ''
    const width = this.el.offsetWidth
    const height = this.el.offsetHeight
    this.el.style.width = prevW
    this.el.style.height = prevH
    return { width, height }
  }

  setSize(w, h, minW, minH) {
    const min = minW != null && minH != null ? { width: minW, height: minH } : this.getMinSize()
    const newW = this.resizableW ? Math.max(min.width, w) : this.width
    const newH = this.resizableH ? Math.max(min.height, h) : min.height
    this.width = newW
    this.height = newH
    if (this.el) {
      this.el.style.width = `${this.width}px`
      this.el.style.height = `${this.height}px`
    }
  }

  resizeToContent() {
    if (this.resizableH || !this.el) return
    const min = this.getMinSize()
    this.height = min.height
    this.el.style.height = `${this.height}px`
    for (const s of this.inputs.concat(this.outputs)) {
      for (const n of s.connections) n.updatePath()
    }
  }

  requestResize() {
    requestAnimationFrame(() => this.resizeToContent())
  }

  addInputSocket(id, label = id, dataType = 'default') {
    const s = new Socket(this, 'input', id, label, dataType)
    this.inputs.push(s)
    return s
  }

  addOutputSocket(id, label = id, dataType = 'default') {
    const s = new Socket(this, 'output', id, label, dataType)
    this.outputs.push(s)
    return s
  }
}
