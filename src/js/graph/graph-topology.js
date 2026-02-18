export function getExecutionOrder(nodes, noodles) {
  const nodeSet = new Set(nodes)
  const outEdges = new Map()
  const inDegree = new Map()
  for (const n of nodes) {
    outEdges.set(n, [])
    inDegree.set(n, 0)
  }
  for (const noodle of noodles) {
    if (!noodle.fromSocket?.node || !noodle.toSocket?.node) continue
    const from = noodle.fromSocket.node
    const to = noodle.toSocket.node
    if (!nodeSet.has(from) || !nodeSet.has(to) || from === to) continue
    outEdges.get(from).push(to)
    inDegree.set(to, inDegree.get(to) + 1)
  }
  const queue = nodes.filter(n => inDegree.get(n) === 0)
  const order = []
  while (queue.length) {
    const n = queue.shift()
    order.push(n)
    for (const out of outEdges.get(n)) {
      const d = inDegree.get(out) - 1
      inDegree.set(out, d)
      if (d === 0) queue.push(out)
    }
  }
  return order.length === nodes.length ? order : null
}

export function hasCycles(nodes, noodles) {
  return getExecutionOrder(nodes, noodles) === null
}

export function getUpstreamNodes(node, noodles) {
  const upstream = new Set()
  for (const n of noodles) {
    if (n.toSocket?.node === node && n.fromSocket?.node) {
      upstream.add(n.fromSocket.node)
    }
  }
  return [...upstream]
}

export function getDownstreamNodes(node, noodles) {
  const downstream = new Set()
  for (const n of noodles) {
    if (n.fromSocket?.node === node && n.toSocket?.node) {
      downstream.add(n.toSocket.node)
    }
  }
  return [...downstream]
}
