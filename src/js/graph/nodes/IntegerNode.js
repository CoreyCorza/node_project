export const IntegerNode = {
  id: 'integer',
  title: 'Integer Node',
  inputs: [{ id: 'in', label: 'integer', dataType: 'integer' }],
  outputs: [{ id: 'out', label: 'integer', dataType: 'integer' }],
  compute: (inputs) => ({ out: inputs.in ?? 0 })
}
