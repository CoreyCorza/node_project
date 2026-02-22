import { createDropdownWidget } from '../widgets/index.js'

const messages = {
  error: [
    'SyntaxError: Unexpected closing tag </div>, expected </span>',
    'Error: Unclosed element <img> requires self-closing />',
    'Error: Duplicate attribute "class" on <div>',
    'Error: Nested <form> elements are not allowed in HTML',
    'Error: Element <p> cannot contain block-level element <div>',
    'ReferenceError: Entity &nbps; is not defined, did you mean &nbsp;?',
    'Error: <script> tag missing required "type" or "src" attribute',
    'SyntaxError: Unexpected token in attribute list: <div id="main" =>',
    'SyntaxError: Malformed attribute: style="color: red; missing closing quote',
    'Error: Unrecognized element <blink> is deprecated and non-standard'
  ],
  warn: [
    'Warning: <center> is deprecated, use CSS text-align instead',
    'Warning: <font> is deprecated, use CSS font properties instead',
    'Warning: Inline event handler "onclick" detected, prefer addEventListener',
    'Warning: Missing alt attribute on <img> element',
    'Warning: Empty <th> element should use scope attribute',
    'Warning: <marquee> is non-standard and may not work in all browsers',
    'Warning: Implicit <tbody> inserted inside <table>',
    'Warning: <b> should be replaced with <strong> for semantic markup',
    'Warning: Missing lang attribute on <html> element',
    'Warning: <iframe> without sandbox attribute is a security risk'
  ],
  info: [
    'Info: DOCTYPE detected as HTML5',
    'Info: Document contains 42 elements across 7 nesting levels',
    'Info: Charset meta tag found: UTF-8',
    'Info: Viewport meta tag detected with width=device-width',
    'Info: 3 external stylesheets linked',
    'Info: 2 inline <style> blocks found totalling 148 rules',
    'Info: 5 <script> tags found (3 async, 1 defer, 1 blocking)',
    'Info: Document outline: 1 <h1>, 3 <h2>, 7 <h3>',
    'Info: 12 anchor elements found, 4 with target="_blank"',
    'Info: Form detected with 6 input fields and 1 submit button'
  ]
}

export const ErrorNode = {
  id: 'error',
  title: 'Error',
  inputs: [],
  outputs: [{ id: 'out', label: 'output', dataType: 'string' }],
  compute: (inputs, node) => {
    const mode = node?.errorMode ?? 'error'
    const pool = messages[mode] ?? messages.error
    const msg = pool[Math.floor(Math.random() * pool.length)]
    return { out: msg }
  },
  createWidget: (node) => {
    if (node.errorMode === undefined) node.errorMode = 'error'

    const wrap = document.createElement('div')
    wrap.className = 'widget-row'

    const label = document.createElement('span')
    label.className = 'widget-label'
    label.textContent = 'mode'
    wrap.appendChild(label)

    const dropdown = createDropdownWidget({
      items: [
        { value: 'error', label: 'Error' },
        { value: 'warn', label: 'Warning' },
        { value: 'info', label: 'Info' }
      ],
      value: node.errorMode,
      onChange: (val) => { node.errorMode = val },
      trackEl: node.graphContainer
    })
    wrap.appendChild(dropdown)

    return wrap
  }
}
