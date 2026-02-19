import { Node } from './Node.js'
import { Noodle } from './noodles/index.js'
import { canConnect } from './socket-types.js'
import { getExecutionOrder, hasCycles, getUpstreamNodes, getDownstreamNodes } from './graph-topology.js'
import { getNodeType } from './nodes/index.js'

export class Graph {
  constructor(containerEl) {
    this.containerEl = containerEl
    this.nodes = []
    this.noodles = []
    this.canvasEl = null
    this.nodesEl = null
    this.draggingNode = null
    this.dragOffset = { x: 0, y: 0 }
    this.resizingNode = null
    this.resizeStart = { width: 0, height: 0, x: 0, y: 0 }
    this.draggingNoodle = null
    this.dragFromSocket = null
    this.dragToSocket = null
    this.snapDistance = 20
    this.selectedNodes = new Set()
    this.selecting = false
    this.selectionStart = null
    this.selectionBoxEl = null
    this.dragNodes = null
    this.zoom = 1
    this.panX = 0
    this.panY = 0
    this.panning = false
    this.panStart = null
    this.transformEl = null
    this.zoomToastEl = null
    this.zoomToastTimeout = null
    this.nodeContextMenuEl = null
    this.graphContextMenuEl = null
    this.contextNode = null
    this.contextGraphPos = null
    this.clipboard = null
    this.lastMouseGraphPos = null

    this.storageKey = 'node-graph-state'
    this.saveDebounce = null
    try {
      const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
      this.noodleStyle = s.noodleStyle === 'linear' ? 'linear' : 'smooth'
    } catch {
      this.noodleStyle = 'smooth'
    }
    this.init()
  }

  serialize() {
    const nodes = this.nodes.map(n => {
      const base = {
        id: n.id,
        title: n.title,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        nodeTypeId: n.nodeTypeId || undefined,
        inputs: n.inputs.map(s => ({ id: s.id, label: s.label, dataType: s.dataType })),
        outputs: n.outputs.map(s => ({ id: s.id, label: s.label, dataType: s.dataType }))
      }
      if (n.nodeTypeId === 'load-file' && n.selectedFilePath) base.selectedFilePath = n.selectedFilePath
      if (n.nodeTypeId === 'bool') base.booleanValue = n.booleanValue
      if (n.nodeTypeId === 'input') {
        if (n.inputValue !== undefined) base.inputValue = n.inputValue
        if (n.inputDataType !== undefined) base.inputDataType = n.inputDataType
        if (n.booleanValue !== undefined) base.booleanValue = n.booleanValue
        if (n.floatRound !== undefined) base.floatRound = n.floatRound
        if (n.floatDecimals !== undefined) base.floatDecimals = n.floatDecimals
      }
      return base
    })
    const connections = this.noodles
      .filter(n => n.fromSocket && n.toSocket)
      .map(n => ({
        fromNode: n.fromSocket.node.id,
        fromSocket: n.fromSocket.id,
        toNode: n.toSocket.node.id,
        toSocket: n.toSocket.id
      }))
    return { nodes, connections }
  }

  load(data) {
    this.clear()
    if (!data?.nodes?.length) return
    const nodeMap = {}
    for (const n of data.nodes) {
      const node = this.addNode(n.title, n.x, n.y, {
        id: n.id,
        width: n.width,
        height: n.height,
        nodeTypeId: n.nodeTypeId,
        inputs: n.inputs,
        outputs: n.outputs,
        inputValue: n.inputValue,
        inputDataType: n.inputDataType,
        booleanValue: n.booleanValue,
        floatRound: n.floatRound,
        floatDecimals: n.floatDecimals
      })
      if (n.nodeTypeId === 'load-file' && n.selectedFilePath) {
        node.selectedFilePath = n.selectedFilePath
        const pathEl = node.el?.querySelector('.node-widget-path')
        if (pathEl) pathEl.textContent = n.selectedFilePath
      }
      if (n.nodeTypeId === 'bool' && n.booleanValue !== undefined) {
        node.booleanValue = n.booleanValue
        const toggle = node.el?.querySelector('.widget-boolean-toggle')
        if (toggle) {
          toggle.classList.toggle('on', node.booleanValue)
          toggle.setAttribute('aria-checked', node.booleanValue)
        }
      }
      nodeMap[n.id] = node
    }
    for (const c of data.connections ?? []) {
      const fromNode = nodeMap[c.fromNode]
      const toNode = nodeMap[c.toNode]
      if (!fromNode || !toNode) continue
      const fromSocket = fromNode.outputs.find(s => s.id === c.fromSocket)
      const toSocket = toNode.inputs.find(s => s.id === c.toSocket)
      if (!fromSocket || !toSocket || !canConnect(fromSocket, toSocket)) continue
      for (const old of [...toSocket.connections]) old.remove()
      const noodle = new Noodle(this, fromSocket, toSocket)
      noodle.createElement()
      this.noodles.push(noodle)
      this.nodesEl.appendChild(noodle.el)
      fromSocket.addConnection(noodle)
      toSocket.addConnection(noodle)
      noodle.updatePath()
      noodle.updateColor()
    }
  }

  setNoodleStyle(style) {
    if (style !== 'smooth' && style !== 'linear') return
    this.noodleStyle = style
    this.noodles.forEach(n => n.updatePath())
    try {
      const s = JSON.parse(localStorage.getItem('node-graph-settings') || '{}')
      s.noodleStyle = style
      localStorage.setItem('node-graph-settings', JSON.stringify(s))
    } catch (_) {}
  }

  setPulseNoodles(pulse) {
    this.noodles.forEach(n => n.setPulse(pulse))
  }

  clear() {
    this.noodles.forEach(n => n.remove())
    this.noodles = []
    this.nodes.forEach(n => n.el?.remove())
    this.nodes = []
  }

  save() {
    clearTimeout(this.saveDebounce)
    this.saveDebounce = setTimeout(() => {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.serialize()))
      } catch (_) {}
    }, 100)
  }

  init() {
    const canvas = document.createElement('div')
    canvas.className = 'node-graph-canvas'
    this.containerEl.appendChild(canvas)

    const zoomToast = document.createElement('div')
    zoomToast.className = 'zoom-toast'
    zoomToast.textContent = '100%'
    this.containerEl.appendChild(zoomToast)
    this.zoomToastEl = zoomToast
    this.canvasEl = canvas

    const transformWrap = document.createElement('div')
    transformWrap.className = 'node-graph-transform'
    canvas.appendChild(transformWrap)
    this.transformEl = transformWrap

    const nodesWrap = document.createElement('div')
    nodesWrap.className = 'node-graph-nodes'
    transformWrap.appendChild(nodesWrap)
    this.nodesEl = nodesWrap

    const selectionBox = document.createElement('div')
    selectionBox.className = 'selection-box'
    selectionBox.style.display = 'none'
    nodesWrap.appendChild(selectionBox)
    this.selectionBoxEl = selectionBox

    this.applyTransform()
    canvas.addEventListener('mousedown', this.onCanvasMouseDown.bind(this))
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      if (!e.target.closest('.node')) this.showGraphContextMenu(e.clientX, e.clientY)
    })
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false })
    window.addEventListener('mousedown', this.onWindowMouseDown.bind(this), true)
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('mouseup', this.onMouseUp.bind(this))
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    this.containerEl.addEventListener('contextmenu', (e) => e.preventDefault())
    this.createContextMenu()
  }

  createContextMenu() {
    const nodeMenu = document.createElement('div')
    nodeMenu.className = 'context-menu'
    nodeMenu.innerHTML = `<div class="context-item context-delete" data-action="delete">Delete</div>`
    nodeMenu.style.display = 'none'
    document.body.appendChild(nodeMenu)
    this.nodeContextMenuEl = nodeMenu

    nodeMenu.querySelector('.context-item').addEventListener('click', (e) => {
      e.stopPropagation()
      this.removeSelectedNodes()
      this.hideContextMenu()
    })

    const graphMenu = document.createElement('div')
    graphMenu.className = 'context-menu'
    graphMenu.innerHTML = `
      <div class="context-item has-submenu">
        <span>Add</span>
        <span class="submenu-arrow">›</span>
        <div class="context-submenu">
          <div class="context-item" data-action="add-load-file">Load File</div>
          <div class="context-item" data-action="add-debug">Debug</div>
          <div class="context-item" data-action="add-test">Test Node</div>
          <div class="context-item" data-action="add-float">Float Node</div>
          <div class="context-item" data-action="add-string">String Node</div>
          <div class="context-item" data-action="add-int">Integer Node</div>
          <div class="context-item" data-action="add-bool">Bool Node</div>
          <div class="context-item" data-action="add-input">Input Node</div>
        </div>
      </div>
    `
    graphMenu.style.display = 'none'
    document.body.appendChild(graphMenu)
    this.graphContextMenuEl = graphMenu

    graphMenu.querySelector('.has-submenu').addEventListener('mouseenter', () => {
      graphMenu.querySelector('.context-submenu').classList.add('visible')
    })
    graphMenu.querySelector('.has-submenu').addEventListener('mouseleave', () => {
      graphMenu.querySelector('.context-submenu').classList.remove('visible')
    })

    graphMenu.querySelector('.context-submenu').addEventListener('click', (e) => {
      e.stopPropagation()
      const item = e.target.closest('.context-item[data-action]')
      if (item && item.dataset.action?.startsWith('add-') && this.contextGraphPos) {
        const typeMap = { 'add-load-file': 'load-file', 'add-debug': 'debug', 'add-test': 'test', 'add-float': 'float', 'add-string': 'string', 'add-int': 'integer', 'add-bool': 'bool', 'add-input': 'input' }
        const typeId = typeMap[item.dataset.action]
        if (typeId) {
          const def = getNodeType(typeId)
          this.addNode(def?.title ?? typeId, this.contextGraphPos.x, this.contextGraphPos.y, { nodeTypeId: typeId })
        }
        this.save()
      }
      this.hideContextMenu()
    })

    const hideCheck = (e) => {
      if (!nodeMenu.contains(e.target) && !graphMenu.contains(e.target)) {
        this.hideContextMenu()
      }
    }
    document.addEventListener('mousedown', hideCheck)
  }

  showContextMenu(node, clientX, clientY) {
    if (!this.nodeContextMenuEl) return
    this.contextNode = node
    const menu = this.nodeContextMenuEl
    document.body.classList.add('context-menu-open')
    menu.style.display = 'block'
    menu.style.left = `${clientX}px`
    menu.style.top = `${clientY}px`
    menu.classList.remove('visible')
    const rect = menu.getBoundingClientRect()
    if (rect.right > window.innerWidth) menu.style.left = `${clientX - rect.width}px`
    if (rect.bottom > window.innerHeight) menu.style.top = `${clientY - rect.height}px`
    requestAnimationFrame(() => menu.classList.add('visible'))
  }

  showGraphContextMenu(clientX, clientY) {
    if (!this.graphContextMenuEl) return
    this.contextGraphPos = this.getGraphCoords(clientX, clientY)
    const menu = this.graphContextMenuEl
    document.body.classList.add('context-menu-open')
    menu.style.display = 'block'
    menu.style.left = `${clientX}px`
    menu.style.top = `${clientY}px`
    menu.classList.remove('visible')
    menu.querySelector('.context-submenu')?.classList.remove('visible')
    const rect = menu.getBoundingClientRect()
    if (rect.right > window.innerWidth) menu.style.left = `${clientX - rect.width}px`
    if (rect.bottom > window.innerHeight) menu.style.top = `${clientY - rect.height}px`
    requestAnimationFrame(() => menu.classList.add('visible'))
  }

  hideContextMenu() {
    document.body.classList.remove('context-menu-open')
    if (this.nodeContextMenuEl) {
      this.nodeContextMenuEl.style.display = 'none'
      this.nodeContextMenuEl.classList.remove('visible')
    }
    if (this.graphContextMenuEl) {
      this.graphContextMenuEl.style.display = 'none'
      this.graphContextMenuEl.classList.remove('visible')
    }
    this.contextNode = null
    this.contextGraphPos = null
  }

  removeNode(node) {
    node.inputs.concat(node.outputs).forEach(s => {
      [...s.connections].forEach(n => n.remove())
    })
    node.el?.remove()
    this.nodes = this.nodes.filter(n => n !== node)
    this.selectedNodes.delete(node)
    this.save()
  }

  removeSelectedNodes() {
    for (const node of [...this.selectedNodes]) {
      this.removeNode(node)
    }
  }

  copySelectedNodes() {
    const nodes = [...this.selectedNodes]
    if (!nodes.length) return
    const ids = new Set(nodes.map(n => n.id))
    const nodesData = nodes.map(n => {
      const base = {
        id: n.id,
        title: n.title,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        nodeTypeId: n.nodeTypeId || undefined,
        inputs: n.inputs.map(s => ({ id: s.id, label: s.label, dataType: s.dataType })),
        outputs: n.outputs.map(s => ({ id: s.id, label: s.label, dataType: s.dataType }))
      }
      if (n.nodeTypeId === 'load-file' && n.selectedFilePath) base.selectedFilePath = n.selectedFilePath
      if (n.nodeTypeId === 'bool') base.booleanValue = n.booleanValue
      if (n.nodeTypeId === 'input') {
        if (n.inputValue !== undefined) base.inputValue = n.inputValue
        if (n.inputDataType !== undefined) base.inputDataType = n.inputDataType
        if (n.booleanValue !== undefined) base.booleanValue = n.booleanValue
        if (n.floatRound !== undefined) base.floatRound = n.floatRound
        if (n.floatDecimals !== undefined) base.floatDecimals = n.floatDecimals
      }
      return base
    })
    const connections = this.noodles
      .filter(n => n.fromSocket && n.toSocket && ids.has(n.fromSocket.node.id) && ids.has(n.toSocket.node.id))
      .map(n => ({
        fromNode: n.fromSocket.node.id,
        fromSocket: n.fromSocket.id,
        toNode: n.toSocket.node.id,
        toSocket: n.toSocket.id
      }))
    this.clipboard = { nodes: nodesData, connections }
  }

  pasteNodes() {
    if (!this.clipboard?.nodes?.length) return
    const rect = this.canvasEl?.getBoundingClientRect()
    if (!rect) return
    const pasteX = this.lastMouseGraphPos?.x ?? (rect.width / 2 - this.panX) / this.zoom
    const pasteY = this.lastMouseGraphPos?.y ?? (rect.height / 2 - this.panY) / this.zoom
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of this.clipboard.nodes) {
      const maxW = n.x + (n.width || 180)
      const maxH = n.y + (n.height || 0)
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, maxW)
      maxY = Math.max(maxY, maxH)
    }
    const bboxCenterX = (minX + maxX) / 2
    const bboxCenterY = (minY + maxY) / 2
    const offsetX = pasteX - bboxCenterX
    const offsetY = pasteY - bboxCenterY
    const nodeMap = {}
    this.selectedNodes.clear()
    for (const n of this.clipboard.nodes) {
      const node = this.addNode(n.title, n.x + offsetX, n.y + offsetY, {
        width: n.width,
        height: n.height,
        nodeTypeId: n.nodeTypeId,
        inputs: n.inputs,
        outputs: n.outputs,
        inputValue: n.inputValue,
        inputDataType: n.inputDataType,
        booleanValue: n.booleanValue,
        floatRound: n.floatRound,
        floatDecimals: n.floatDecimals
      })
      if (n.nodeTypeId === 'load-file' && n.selectedFilePath) {
        node.selectedFilePath = n.selectedFilePath
        const pathEl = node.el?.querySelector('.node-widget-path')
        if (pathEl) pathEl.textContent = n.selectedFilePath
      }
      if (n.nodeTypeId === 'bool' && n.booleanValue !== undefined) {
        node.booleanValue = n.booleanValue
        const toggle = node.el?.querySelector('.widget-boolean-toggle')
        if (toggle) {
          toggle.classList.toggle('on', node.booleanValue)
          toggle.setAttribute('aria-checked', node.booleanValue)
        }
      }
      nodeMap[n.id] = node
      this.selectedNodes.add(node)
    }
    for (const c of this.clipboard.connections) {
      const fromNode = nodeMap[c.fromNode]
      const toNode = nodeMap[c.toNode]
      if (!fromNode || !toNode) continue
      const fromSocket = fromNode.outputs.find(s => s.id === c.fromSocket)
      const toSocket = toNode.inputs.find(s => s.id === c.toSocket)
      if (!fromSocket || !toSocket || !canConnect(fromSocket, toSocket)) continue
      for (const old of [...toSocket.connections]) old.remove()
      const noodle = new Noodle(this, fromSocket, toSocket)
      noodle.createElement()
      this.noodles.push(noodle)
      this.nodesEl.appendChild(noodle.el)
      fromSocket.addConnection(noodle)
      toSocket.addConnection(noodle)
      noodle.updatePath()
      noodle.updateColor()
    }
    this.updateSelectionUI()
    this.save()
  }

  getExecutionOrder() {
    return getExecutionOrder(this.nodes, this.noodles)
  }

  hasCycles() {
    return hasCycles(this.nodes, this.noodles)
  }

  getUpstreamNodes(node) {
    return getUpstreamNodes(node, this.noodles)
  }

  getDownstreamNodes(node) {
    return getDownstreamNodes(node, this.noodles)
  }

  async execute() {
    for (const n of this.nodes) {
      for (const s of [...n.inputs, ...n.outputs]) s.value = undefined
    }
    const order = this.getExecutionOrder()
    if (!order) return { ok: false, error: 'Graph contains cycles' }
    for (const node of order) {
      const inputs = {}
      for (const s of node.inputs) {
        const conn = s.connections[0]
        if (conn?.fromSocket) inputs[s.id] = conn.fromSocket.value
      }
      const outputs = node.compute(inputs)
      if (outputs && typeof outputs === 'object') {
        for (const s of node.outputs) {
          if (s.id in outputs) s.value = outputs[s.id]
        }
      }
    }
    for (const node of this.nodes) {
      const fn = node.afterExecute
      if (fn) await Promise.resolve(fn.call(node))
    }
    return { ok: true }
  }

  centerViewOnNodes() {
    if (!this.nodes.length || !this.canvasEl) return
    const minH = (n) => n.height > 0 ? n.height : n.getMinSize().height
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of this.nodes) {
      const h = minH(n)
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, n.x + n.width)
      maxY = Math.max(maxY, n.y + h)
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const rect = this.canvasEl.getBoundingClientRect()
    this.panX = rect.width / 2 - cx * this.zoom
    this.panY = rect.height / 2 - cy * this.zoom
    this.applyTransform()
  }

  onKeyDown(e) {
    const active = document.activeElement
    const inInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA'
    if (e.key === 'c' && (e.ctrlKey || e.metaKey) && !inInput) {
      this.copySelectedNodes()
      e.preventDefault()
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey) && !inInput) {
      this.pasteNodes()
      e.preventDefault()
    } else if ((e.key === 'Delete' || e.key === 'Backspace' || e.key === 'x') && !e.ctrlKey && !e.metaKey && !e.altKey && !inInput) {
      this.removeSelectedNodes()
      e.preventDefault()
    } else if (e.key === '.' && !e.ctrlKey && !e.metaKey && !e.altKey && !inInput) {
      this.centerViewOnNodes()
      e.preventDefault()
    }
  }

  applyTransform() {
    if (!this.transformEl) return
    this.transformEl.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`
    this.containerEl?.dispatchEvent(new CustomEvent('graphtransform'))
  }

  getViewCoords(clientX, clientY) {
    const rect = this.canvasEl.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  getGraphCoords(clientX, clientY) {
    const v = this.getViewCoords(clientX, clientY)
    return {
      x: (v.x - this.panX) / this.zoom,
      y: (v.y - this.panY) / this.zoom
    }
  }

  addNode(title, x = 100, y = 100, options = {}) {
    const id = options.id ?? `node-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const typeDef = options.nodeTypeId ? getNodeType(options.nodeTypeId) : null
    const inputs = options.inputs ?? typeDef?.inputs ?? [{ id: 'in', label: 'in' }]
    const outputs = options.outputs ?? typeDef?.outputs ?? [{ id: 'out', label: 'out' }]
    let computeFn = options.computeFn ?? typeDef?.compute ?? null
    const height = (options.height != null && options.height > 0) ? options.height : (typeDef?.defaultHeight ?? 0)
    const node = new Node(this, id, title, x, y, options.width, height, {
      nodeTypeId: options.nodeTypeId ?? null,
      resizableW: options.resizableW ?? typeDef?.resizableW ?? true,
      resizableH: options.resizableH ?? typeDef?.resizableH ?? false,
      computeFn: null,
      createWidget: options.createWidget ?? typeDef?.createWidget ?? null,
      afterExecute: options.afterExecute ?? typeDef?.afterExecute ?? null
    })
    node.computeFn = typeof computeFn === 'function' && computeFn.length >= 2
      ? (inputs) => computeFn(inputs, node)
      : computeFn
    inputs.forEach(s => node.addInputSocket(s.id ?? s, s.label ?? s, s.dataType ?? 'default'))
    outputs.forEach(s => node.addOutputSocket(s.id ?? s, s.label ?? s, s.dataType ?? 'default'))
    if (options.nodeTypeId === 'input') {
      if (options.inputValue !== undefined) node.inputValue = options.inputValue
      if (options.inputDataType !== undefined) node.inputDataType = options.inputDataType
      if (options.booleanValue !== undefined) node.booleanValue = options.booleanValue
      if (options.floatRound !== undefined) node.floatRound = options.floatRound
      if (options.floatDecimals !== undefined) node.floatDecimals = options.floatDecimals
    }
    this.nodes.push(node)
    this.nodesEl.appendChild(node.createElement())
    this.setupNodeEvents(node)
    if (!node.resizableH && typeDef?.heightFollowsContent !== false) requestAnimationFrame(() => node.resizeToContent())
    return node
  }

  setupNodeEvents(node) {
    const startDrag = (e) => {
      if (e.button !== 0) return
      e.stopPropagation()
      if (!this.selectedNodes.has(node)) {
        this.selectedNodes.clear()
        this.selectedNodes.add(node)
        this.updateSelectionUI()
      }
      this.draggingNode = node
      this.dragNodes = [...this.selectedNodes]
      this.dragStartView = this.getViewCoords(e.clientX, e.clientY)
      this.dragStartPositions = this.dragNodes.map(n => ({ node: n, x: n.x, y: n.y }))
    }

    const header = node.el.querySelector('.node-header')
    if (header) header.addEventListener('mousedown', startDrag)

    const dragZone = node.el.querySelector('.node-drag-zone')
    if (dragZone) dragZone.addEventListener('mousedown', startDrag)

    node.el.querySelectorAll('.node-sockets-row, .socket-row, .node-sockets').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        if (e.target.closest('.socket')) return
        startDrag(e)
      })
    })

    node.el.querySelectorAll('.socket').forEach(socketEl => {
      const socket = [...node.inputs, ...node.outputs].find(s => s.el === socketEl)
      if (!socket) return

      socketEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return
        e.stopPropagation()
        this.startNoodleDrag(socket, e)
      })
    })

    node.el.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!this.selectedNodes.has(node)) {
        this.selectedNodes.clear()
        this.selectedNodes.add(node)
        this.updateSelectionUI()
      }
      this.showContextMenu(node, e.clientX, e.clientY)
    })

    const resizeHandle = node.el.querySelector('.node-resize-handle')
    if (resizeHandle) {
      if (!node.resizableW && !node.resizableH) {
        resizeHandle.style.display = 'none'
      } else {
        resizeHandle.style.cursor = node.resizableW && node.resizableH ? 'nwse-resize' : node.resizableW ? 'ew-resize' : 'ns-resize'
      }
      resizeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return
        e.stopPropagation()
        this.resizingNode = node
        const min = node.getMinSize()
        this.resizeStart = {
          width: node.width,
          height: node.height || min.height,
          minWidth: min.width,
          minHeight: min.height,
          clientX: e.clientX,
          clientY: e.clientY
        }
      })
    }
  }

  startNoodleDrag(socket, e) {
    if (socket.type === 'input') {
      const noodle = socket.connections[0]
      if (noodle) {
        noodle.fromSocket.removeConnection(noodle)
        noodle.toSocket?.removeConnection(noodle)
        noodle.toSocket = null
        this.draggingNoodle = noodle
        this.dragFromSocket = noodle.fromSocket
        this.dragToSocket = socket
        noodle.setPreview(true)
        noodle.updatePath(e.clientX, e.clientY)
      } else {
        const newNoodle = new Noodle(this, null, socket)
        newNoodle.createElement()
        this.noodles.push(newNoodle)
        this.nodesEl.appendChild(newNoodle.el)
        newNoodle.setPreview(true)
        this.draggingNoodle = newNoodle
        this.dragFromSocket = null
        this.dragToSocket = socket
        newNoodle.updatePath(e.clientX, e.clientY, null)
      }
      return
    }

    const noodle = new Noodle(this, socket)
    noodle.createElement()
    this.noodles.push(noodle)
    this.nodesEl.appendChild(noodle.el)
    noodle.setPreview(true)
    this.draggingNoodle = noodle
    this.dragFromSocket = socket
    this.dragToSocket = null
    noodle.updatePath(e.clientX, e.clientY)
  }

  getNearestSnapSocket(clientX, clientY) {
    if (!this.canvasEl || (!this.dragFromSocket && !this.dragToSocket)) return null
    const { x: cx, y: cy } = this.getGraphCoords(clientX, clientY)
    let nearest = null
    let nearestD = this.snapDistance
    const targetType = this.dragToSocket ? 'output' : 'input'
    for (const node of this.nodes) {
      for (const socket of [...node.inputs, ...node.outputs]) {
        if (this.dragFromSocket && socket === this.dragFromSocket) continue
        if (socket.type !== targetType) continue
        if (this.dragToSocket) {
          if (!canConnect(socket, this.dragToSocket)) continue
        } else {
          if (!canConnect(this.dragFromSocket, socket)) continue
        }
        const c = socket.getCenter()
        if (!c) continue
        const d = Math.hypot(cx - c.x, cy - c.y)
        if (d < nearestD) {
          nearestD = d
          nearest = socket
        }
      }
    }
    return nearest
  }

  toCanvasCoords(clientX, clientY) {
    return this.getGraphCoords(clientX, clientY)
  }

  updateSelectionUI() {
    this.nodes.forEach(n => n.el?.classList.toggle('selected', this.selectedNodes.has(n)))
  }

  nodesInRect(left, top, right, bottom) {
    return this.nodes.filter(n => {
      const min = n.getMinSize()
      const nw = n.width
      const nh = n.height || min.height
      return n.x < right && n.x + nw > left && n.y < bottom && n.y + nh > top
    })
  }

  onWindowMouseDown(e) {
    if (e.button === 1 && this.canvasEl?.contains(e.target)) {
      this.panning = true
      this.panStart = { panX: this.panX, panY: this.panY, clientX: e.clientX, clientY: e.clientY }
      e.preventDefault()
    }
  }

  onCanvasMouseDown(e) {
    if (e.target === this.canvasEl || e.target === this.nodesEl) {
      if (e.button === 1) {
        this.panning = true
        this.panStart = { panX: this.panX, panY: this.panY, clientX: e.clientX, clientY: e.clientY }
        return
      }
      if (e.button !== 0) return
      this.draggingNode = null
      this.resizingNode = null
      this.draggingNoodle = null
      this.dragNodes = null
      const pt = this.toCanvasCoords(e.clientX, e.clientY)
      this.selecting = true
      this.selectionStart = pt
      this.selectionSubtract = e.ctrlKey
      this.selectionAdd = e.shiftKey
      this.selectionBoxEl.style.display = 'block'
      this.selectionBoxEl.style.left = `${pt.x}px`
      this.selectionBoxEl.style.top = `${pt.y}px`
      this.selectionBoxEl.style.width = '0'
      this.selectionBoxEl.style.height = '0'
    }
  }

  onWheel(e) {
    e.preventDefault()
    const v = this.getViewCoords(e.clientX, e.clientY)
    const gx = (v.x - this.panX) / this.zoom
    const gy = (v.y - this.panY) / this.zoom
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.25, Math.min(3, this.zoom * factor))
    this.panX = v.x - gx * newZoom
    this.panY = v.y - gy * newZoom
    this.zoom = newZoom
    this.applyTransform()
    this.showZoomToast()
  }

  showZoomToast() {
    if (!this.zoomToastEl) return
    const pct = Math.round(this.zoom * 100)
    this.zoomToastEl.textContent = `${pct}%`
    this.zoomToastEl.classList.add('visible')
    clearTimeout(this.zoomToastTimeout)
    this.zoomToastTimeout = setTimeout(() => {
      this.zoomToastEl.classList.remove('visible')
    }, 800)
  }

  onMouseMove(e) {
    if (this.canvasEl?.contains(e.target)) {
      this.lastMouseGraphPos = this.getGraphCoords(e.clientX, e.clientY)
    }
    if (this.panning) {
      this.panX = this.panStart.panX + (e.clientX - this.panStart.clientX)
      this.panY = this.panStart.panY + (e.clientY - this.panStart.clientY)
      this.applyTransform()
      return
    }
    if (this.selecting) {
      const pt = this.toCanvasCoords(e.clientX, e.clientY)
      const left = Math.min(this.selectionStart.x, pt.x)
      const top = Math.min(this.selectionStart.y, pt.y)
      const w = Math.abs(pt.x - this.selectionStart.x)
      const h = Math.abs(pt.y - this.selectionStart.y)
      this.selectionBoxEl.style.left = `${left}px`
      this.selectionBoxEl.style.top = `${top}px`
      this.selectionBoxEl.style.width = `${w}px`
      this.selectionBoxEl.style.height = `${h}px`
      return
    }
    if (this.resizingNode) {
      const node = this.resizingNode
      const dw = (e.clientX - this.resizeStart.clientX) / this.zoom
      const dh = (e.clientY - this.resizeStart.clientY) / this.zoom
      const newW = node.resizableW ? this.resizeStart.width + dw : node.width
      const newH = node.resizableH ? this.resizeStart.height + dh : node.getMinSize().height
      node.setSize(newW, newH, this.resizeStart.minWidth, this.resizeStart.minHeight)
      node.inputs.concat(node.outputs).forEach(s => {
        s.connections.forEach(n => n.updatePath())
      })
      return
    }

    if (this.draggingNode && this.dragNodes) {
      const v = this.getViewCoords(e.clientX, e.clientY)
      const dx = (v.x - this.dragStartView.x) / this.zoom
      const dy = (v.y - this.dragStartView.y) / this.zoom
      for (const { node, x, y } of this.dragStartPositions) {
        node.setPosition(x + dx, y + dy)
        node.inputs.concat(node.outputs).forEach(s => {
          s.connections.forEach(conn => conn.updatePath())
        })
      }
      return
    }

    if (this.draggingNoodle) {
      const snap = this.getNearestSnapSocket(e.clientX, e.clientY)
      this.draggingNoodle.updatePath(e.clientX, e.clientY, snap)
    }
  }

  onMouseUp(e) {
    if (e.button === 1) {
      this.panning = false
      return
    }
    if (e.button !== 0) return

    const hadDrag = this.draggingNode || this.resizingNode || this.draggingNoodle

    if (this.panning) return

    if (this.selecting) {
      const pt = this.toCanvasCoords(e.clientX, e.clientY)
      const left = Math.min(this.selectionStart.x, pt.x)
      const top = Math.min(this.selectionStart.y, pt.y)
      const right = Math.max(this.selectionStart.x, pt.x)
      const bottom = Math.max(this.selectionStart.y, pt.y)
      const w = right - left
      const h = bottom - top
      if (w > 4 || h > 4) {
        const inRect = this.nodesInRect(left, top, right, bottom)
        if (this.selectionSubtract) {
          inRect.forEach(n => this.selectedNodes.delete(n))
        } else if (this.selectionAdd) {
          inRect.forEach(n => this.selectedNodes.add(n))
        } else {
          this.selectedNodes = new Set(inRect)
        }
      } else {
        this.selectedNodes.clear()
      }
      this.updateSelectionUI()
      this.selectionBoxEl.style.display = 'none'
      this.selecting = false
    }

    if (this.draggingNoodle) {
      let socket = null
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const socketEl = el?.closest('.socket')
      if (socketEl) {
        const nodeEl = socketEl.closest('.node')
        const node = this.nodes.find(n => n.el === nodeEl)
        if (node) {
          socket = [...node.inputs, ...node.outputs].find(s => s.el === socketEl)
        }
      }
      if (!socket) socket = this.getNearestSnapSocket(e.clientX, e.clientY)
      if (socket && socket !== this.dragFromSocket) {
        const out = this.dragToSocket ? socket : this.dragFromSocket
        const in_ = this.dragToSocket ? this.dragToSocket : socket
        if (socket.type === 'input' && this.dragFromSocket?.type === 'output' && canConnect(out, in_)) {
          for (const old of [...socket.connections]) old.remove()
          this.draggingNoodle.toSocket = socket
          socket.addConnection(this.draggingNoodle)
          this.dragFromSocket.addConnection(this.draggingNoodle)
          this.draggingNoodle.updatePath()
        } else if (socket.type === 'output' && this.dragToSocket && canConnect(socket, this.dragToSocket)) {
          this.draggingNoodle.fromSocket = socket
          this.draggingNoodle.toSocket = this.dragToSocket
          socket.addConnection(this.draggingNoodle)
          this.dragToSocket.addConnection(this.draggingNoodle)
          this.draggingNoodle.updatePath()
        }
      }

      this.draggingNoodle.setPreview(false)
      if (this.draggingNoodle.fromSocket && this.draggingNoodle.toSocket) {
        this.draggingNoodle.updateColor()
      } else {
        this.draggingNoodle.remove()
      }
      this.draggingNoodle = null
      this.dragFromSocket = null
      this.dragToSocket = null
    }

    this.draggingNode = null
    this.dragNodes = null
    this.dragStartView = null
    this.dragStartPositions = null
    this.resizingNode = null
    if (hadDrag) this.save()
  }
}
