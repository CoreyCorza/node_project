import '../css/console.css'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { emitTo } from '@tauri-apps/api/event'

export class Console {
  constructor({ getDebugEnabled }) {
    this.window = null
    this.buffer = []
    this.getDebugEnabled = getDebugEnabled
    this._hookConsole()
  }

  async open() {
    if (this.window) {
      try {
        await this.window.setFocus()
        return
      } catch {
        this.window = null
      }
    }
    const wv = new WebviewWindow('console', {
      url: '/console.html',
      title: 'Console',
      width: 700,
      height: 400,
      resizable: true,
      decorations: true
    })
    wv.once('tauri://error', () => { this.window = null })
    wv.once('tauri://created', () => {
      this.window = wv
      setTimeout(() => {
        for (const msg of this.buffer) {
          emitTo('console', 'console-message', msg).catch(() => {})
        }
      }, 300)
    })
    wv.once('tauri://destroyed', () => { this.window = null })
  }

  _hookConsole() {
    for (const level of ['log', 'warn', 'error', 'info']) {
      const orig = console[level].bind(console)
      console[level] = (...args) => {
        orig(...args)
        if (level === 'log' && !this.getDebugEnabled()) return
        const msg = { level, text: args.map(stringify).join(' '), timestamp: Date.now() }
        this.buffer.push(msg)
        if (!this.window) return
        emitTo('console', 'console-message', msg).catch(() => {})
      }
    }
  }

  instrumentGraph(graph) {
    wrapMethod(graph, 'addNode', (title, x, y) => {
      console.log(`[Graph] Add node: "${title}" at (${Math.round(x)}, ${Math.round(y)})`)
    })
    wrapMethod(graph, 'removeNode', (node) => {
      console.log(`[Graph] Remove node: "${node.title}" (${node.nodeTypeId})`)
    })
    wrapMethod(graph, 'execute', () => {
      console.log(`[Graph] Execute — ${graph.nodes.length} node(s)`)
    })
    wrapMethod(graph, 'clear', () => {
      console.log('[Graph] Clear')
    })
    wrapMethod(graph, 'load', (data) => {
      const nc = data?.nodes?.length ?? 0
      const cc = data?.connections?.length ?? 0
      console.log(`[Graph] Load — ${nc} node(s), ${cc} connection(s)`)
    })
    wrapMethod(graph, 'copySelectedNodes', () => {
      console.log(`[Graph] Copy — ${graph.selectedNodes.size} node(s)`)
    })
    wrapMethod(graph, 'pasteNodes', () => {
      console.log('[Graph] Paste')
    })
  }
}

function stringify(arg) {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (typeof arg === 'object') {
    try { return JSON.stringify(arg, null, 2) } catch { return String(arg) }
  }
  return String(arg)
}

function wrapMethod(obj, method, logFn) {
  const orig = obj[method].bind(obj)
  obj[method] = function (...args) {
    logFn(...args)
    return orig(...args)
  }
}
