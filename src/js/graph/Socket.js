import { getSocketTypeClass } from './socket-types.js'

export class Socket {
  constructor(node, type, id, label = id, dataType = 'default') {
    this.node = node
    this.type = type
    this.id = id
    this.label = label
    this.dataType = dataType
    this.connections = []
    this.value = undefined
    this.el = null
    this.rowEl = null
  }

  createElement() {
    const row = document.createElement('div')
    row.className = `socket-row ${this.type}`

    const el = document.createElement('div')
    el.className = `socket ${this.type} ${getSocketTypeClass(this.dataType)}`
    el.dataset.socketId = this.id
    el.dataset.socketType = this.type
    el.dataset.socketDataType = this.dataType

    const labelEl = document.createElement('span')
    labelEl.className = 'socket-label'
    labelEl.textContent = this.label

    if (this.type === 'input') {
      row.appendChild(el)
      row.appendChild(labelEl)
    } else {
      row.appendChild(labelEl)
      row.appendChild(el)
    }

    this.el = el
    this.rowEl = row
    return row
  }

  getCenter() {
    if (!this.el) return null
    const rect = this.el.getBoundingClientRect()
    const graph = this.node.graph
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return graph.getGraphCoords(cx, cy)
  }

  addConnection(conn) {
    if (!this.connections.includes(conn)) this.connections.push(conn)
    this.el?.classList.add('connected')
  }

  removeConnection(conn) {
    this.connections = this.connections.filter(c => c !== conn)
    if (this.connections.length === 0) this.el?.classList.remove('connected')
  }
}
