import '../css/preview.css'

const PLACEHOLDER_SRCDOC = `<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>html,body{background:#3a3a3a;color:#ccc;}</style></head><body style='margin:0;padding:16px;font-family:system-ui;'><p style='color:#888'>Compiled preview will appear here.</p></body></html>`

export class Preview {
  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'preview-panel'
    this.el.innerHTML = `
      <div class="preview-panel-header">
        <span class="preview-panel-title">Preview</span>
        <button class="preview-panel-popout-btn" type="button" aria-label="Pop out">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </button>
      </div>
      <div class="preview-panel-iframe-wrap">
        <iframe id="preview-frame" sandbox="allow-scripts" aria-label="Preview"></iframe>
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
