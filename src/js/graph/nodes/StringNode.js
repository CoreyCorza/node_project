export const StringNode = {
  id: 'string',
  title: 'String Node',
  inputs: [{ id: 'in', label: 'string', dataType: 'string' }],
  outputs: [{ id: 'out', label: 'string', dataType: 'string' }],
  compute: (inputs) => ({ out: inputs.in ?? '' })
}
