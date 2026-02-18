export const FloatNode = {
  id: 'float',
  title: 'Float Node',
  inputs: [{ id: 'in', label: 'float', dataType: 'float' }],
  outputs: [{ id: 'out', label: 'float', dataType: 'float' }],
  compute: (inputs) => ({ out: inputs.in ?? 0 })
}
