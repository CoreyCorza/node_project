import '../css/preview.css'

const PLACEHOLDER_SRCDOC = `<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>html,body{background:#3a3a3a;color:#ccc;}</style></head><body style='margin:0;padding:16px;font-family:system-ui;'><p style='color:#888'>Compiled preview will appear here.</p></body></html>`

export class Preview {
  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'preview-panel'
    this.el.innerHTML = `
      <div class="preview-panel-header">Preview</div>
      <div class="preview-panel-iframe-wrap">
        <iframe id="preview-frame" title="Preview" sandbox="allow-scripts"></iframe>
      </div>
    `
    this.iframe = this.el.querySelector('iframe')
    this.iframe.setAttribute('srcdoc', PLACEHOLDER_SRCDOC)
  }

  getElement() {
    return this.el
  }

  getIframe() {
    return this.iframe
  }

  setHtml(html) {
    const doc = this.iframe?.contentDocument
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
  }

  setPlaceholder() {
    this.iframe?.setAttribute('srcdoc', PLACEHOLDER_SRCDOC)
  }
}
