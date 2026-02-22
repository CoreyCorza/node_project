export function createDebugWidget(node) {
  const wrap = document.createElement('div')
  wrap.className = 'node-widget-debug'

  const pre = document.createElement('pre')
  pre.className = 'node-widget-debug-output'
  pre.textContent = '(no value)'
  node.debugDisplayEl = pre

  wrap.appendChild(pre)

  // inject clear button into the input socket row
  const inputSocket = node.inputs.find(s => s.id === 'in')
  if (inputSocket?.rowEl) {
    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'node-widget-btn node-widget-btn-icon widget-debug-clear'
    clearBtn.title = 'Clear output'
    clearBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>'
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      pre.textContent = ''
    })
    clearBtn.addEventListener('mousedown', (e) => e.stopPropagation())
    clearBtn.addEventListener('pointerdown', (e) => e.stopPropagation())

    inputSocket.rowEl.appendChild(clearBtn)
  }

  return wrap
}
