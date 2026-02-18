export function createDebugWidget(node) {
  const wrap = document.createElement('div')
  wrap.className = 'node-widget-debug'
  const pre = document.createElement('pre')
  pre.className = 'node-widget-debug-output'
  pre.textContent = '(no value)'
  node.debugDisplayEl = pre
  wrap.appendChild(pre)
  return wrap
}
