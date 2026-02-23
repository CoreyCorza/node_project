export const DocumentNode = {
  id: 'document',
  title: 'Document',
  inputs: [
    { id: 'head', label: 'head', dataType: 'string' },
    { id: 'body', label: 'body', dataType: 'string' }
  ],
  outputs: [{ id: 'html', label: 'html', dataType: 'string' }],
  compute: (inputs) => {
    const head = inputs.head ?? ''
    const body = inputs.body ?? ''
    const indent = (str) => str ? str.split('\n').map(l => '  ' + l).join('\n') : ''
    const parts = ['<!DOCTYPE html>', '<html lang="en">']
    if (head) parts.push(indent(head))
    if (body) parts.push(indent(body))
    parts.push('</html>')
    return { html: parts.join('\n') }
  }
}
