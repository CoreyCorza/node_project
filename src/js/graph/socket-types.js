export const SOCKET_TYPES = ['default', 'float', 'integer', 'string', 'bool', 'any']

export const SOCKET_COLORS = {
  default: '#9ae04a',
  float: '#929292',
  integer: '#67d69f',
  string: '#60acc5',
  bool: '#e04ed9',
  any: '#a149db'
}

export function needsGradient(fromSocket, toSocket) {
  if (!fromSocket || !toSocket) return false
  const from = fromSocket.dataType ?? 'default'
  const to = toSocket.dataType ?? 'default'
  if (from === to) return false
  return from === 'any' || to === 'any'
}

export function getGradientColors(fromSocket, toSocket) {
  const from = fromSocket.dataType ?? 'default'
  const to = toSocket.dataType ?? 'default'
  const fromColor = SOCKET_COLORS[from] ?? SOCKET_COLORS.default
  const toColor = SOCKET_COLORS[to] ?? SOCKET_COLORS.default
  return [fromColor, toColor]
}

export function canConnect(fromSocket, toSocket) {
  if (!fromSocket || !toSocket) return false
  if (fromSocket.type !== 'output' || toSocket.type !== 'input') return false
  const from = fromSocket.dataType
  const to = toSocket.dataType
  if (from === 'any' || to === 'any') return true
  return from === to
}

export function getSocketTypeClass(dataType) {
  const type = SOCKET_TYPES.includes(dataType) ? dataType : 'default'
  return `socket-type-${type}`
}

export function getNoodleTypeClass(dataType) {
  const type = SOCKET_TYPES.includes(dataType) ? dataType : 'default'
  return `noodle-type-${type}`
}
