import { getSocketTypeClass } from '../socket-types.js'
import {
  createBooleanWidget,
  createIntegerWidget,
  createFloatWidget,
  createStringWidget,
  createDropdownWidget,
  createDecimalsWidget
} from '../widgets/index.js'

const INPUT_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'float', label: 'Float' },
  { value: 'integer', label: 'Integer' },
  { value: 'bool', label: 'Bool' },
]

function buildInputNodeWidget(node) {
  if (node.inputValue === undefined) node.inputValue = ''
  if (node.inputDataType === undefined) node.inputDataType = 'string'

  const wrap = document.createElement('div')
  wrap.style.display = 'flex'
  wrap.style.flexDirection = 'column'
  wrap.style.gap = '4px'

  const dropdown = createDropdownWidget({
    items: INPUT_TYPES,
    value: node.inputDataType,
    trackEl: node.graph?.containerEl,
    onChange: (val) => applyType(val, false)
  })
  wrap.appendChild(dropdown)

  const controlsWrap = document.createElement('div')
  controlsWrap.style.display = 'flex'
  controlsWrap.style.flexDirection = 'column'
  controlsWrap.style.gap = '4px'
  wrap.appendChild(controlsWrap)

  const boolToggle = createBooleanWidget(node, { label: 'value', tooltip: 'Toggle true / false' })

  let floatWidget = null
  const decimalsWidget = createDecimalsWidget(node, {
    valueKey: 'floatDecimals',
    onChange: () => { floatWidget?.refresh?.() }
  })
  const roundToggle = createBooleanWidget(node, {
    label: 'round',
    valueKey: 'floatRound',
    onChange: () => {
      if (!node.floatRound) {
        node.floatDecimals = 2
        decimalsWidget.refresh()
      }
      floatWidget?.refresh?.()
      decimalsWidget.style.display = node.floatRound ? '' : 'none'
      node.requestResize?.()
    },
    tooltip: 'Enable custom decimals'
  })

  function applyType(type, isInit) {
    node.inputDataType = type
    controlsWrap.innerHTML = ''
    if (!isInit) {
      if (type === 'float' || type === 'integer') {
        node.inputValue = '0'
      } else if (type === 'string') {
        node.inputValue = ''
      }
    }

    if (type === 'bool') {
      controlsWrap.appendChild(boolToggle)
    } else if (type === 'integer') {
      if (!node.inputValue && node.inputValue !== '0') node.inputValue = '0'
      controlsWrap.appendChild(createIntegerWidget(node, { valueKey: 'inputValue' }))
    } else if (type === 'float') {
      if (!node.inputValue && node.inputValue !== '0') node.inputValue = '0'
      node.floatValue = parseFloat(node.inputValue) || 0
      floatWidget = createFloatWidget(node, {
        valueKey: 'floatValue',
        step: 0.1,
        getDecimals: () => node.floatDecimals ?? 2,
        getRound: () => node.floatRound ?? false,
        onChange: () => { node.inputValue = String(node.floatValue) }
      })
      controlsWrap.appendChild(floatWidget)
      controlsWrap.appendChild(roundToggle)
      decimalsWidget.style.display = node.floatRound ? '' : 'none'
      controlsWrap.appendChild(decimalsWidget)
    } else {
      controlsWrap.appendChild(createStringWidget(node, {
        valueKey: 'inputValue',
        placeholder: 'enter value...'
      }))
    }

    node.requestResize?.()

    const outSocket = node.outputs[0]
    if (outSocket) {
      const oldClass = getSocketTypeClass(outSocket.dataType)
      outSocket.dataType = type
      const newClass = getSocketTypeClass(type)
      if (outSocket.el) {
        outSocket.el.classList.remove(oldClass)
        outSocket.el.classList.add(newClass)
        outSocket.el.dataset.socketDataType = type
      }
      if (outSocket.connections) {
        for (const noodle of outSocket.connections) {
          noodle.updateColor()
        }
      }
    }
  }

  applyType(node.inputDataType, true)
  return wrap
}

export const InputNode = {
  id: 'input',
  title: 'Input',
  resizableH: false,
  inputs: [],
  outputs: [{ id: 'out', label: 'value', dataType: 'string' }],
  compute: (inputs, node) => {
    const val = node?.inputValue ?? ''
    const type = node?.inputDataType ?? 'string'
    if (type === 'float') {
      const num = parseFloat(val) || 0
      if (node?.floatRound) {
        const decimals = node.floatDecimals ?? 2
        return { out: parseFloat(num.toFixed(decimals)) }
      }
      return { out: num }
    }
    if (type === 'integer') return { out: parseInt(val, 10) || 0 }
    if (type === 'bool') return { out: node?.booleanValue ?? false }
    return { out: val }
  },
  createWidget: (node) => buildInputNodeWidget(node)
}
