const socketTypes = ['default', 'float', 'integer', 'string', 'bool', 'any']

export const TestNode = {
  id: 'test',
  title: 'Test Node',
  inputs: socketTypes.map(t => ({ id: `in-${t}`, label: t, dataType: t })),
  outputs: socketTypes.map(t => ({ id: `out-${t}`, label: t, dataType: t })),
  compute: (inputs) => {
    const out = {}
    for (const t of socketTypes) out[`out-${t}`] = inputs[`in-${t}`]
    return out
  }
}
