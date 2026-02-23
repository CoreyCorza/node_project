import { convertFileSrc } from '@tauri-apps/api/core'
import { createImageWidget } from '../widgets/index.js'

export const ImageNode = {
  id: 'image',
  title: 'Image',
  resizableW: true,
  resizableH: true,
  defaultWidth: 220,
  defaultHeight: 200,
  inputs: [
    { id: 'width', label: 'width', dataType: 'integer' },
    { id: 'height', label: 'height', dataType: 'integer' }
  ],
  outputs: [{ id: 'html', label: 'html', dataType: 'string' }],
  compute: (inputs, node) => {
    const pickerPath = node.selectedFilePath ?? ''
    node._imageResolvedPath = pickerPath ? convertFileSrc(pickerPath) : ''
    const widgetW = parseInt(node.imageWidth, 10) || 0
    const widgetH = parseInt(node.imageHeight, 10) || 0
    const wMode = node.imageWidthMode || ''
    const hMode = node.imageHeightMode || ''
    node._imageWidth = inputs.width ?? (widgetW || null)
    node._imageHeight = inputs.height ?? (widgetH || null)

    let html = ''
    if (pickerPath) {
      const attrs = [`src="${pickerPath}"`]
      const altText = node.imageAltEnabled ? (node.imageAltText ?? '') : ''
      attrs.push(`alt="${altText}"`)
      const wPct = parseInt(node.imageWidthPercent, 10) || 0
      const hPct = parseInt(node.imageHeightPercent, 10) || 0
      const styles = []
      // width
      if (wMode === 'auto') styles.push('width:auto')
      else if (wMode === 'percent' && wPct) styles.push(`width:${wPct}%`)
      else if (node._imageWidth) styles.push(`width:${node._imageWidth}px`)
      // height
      if (hMode === 'auto') styles.push('height:auto')
      else if (hMode === 'percent' && hPct) styles.push(`height:${hPct}%`)
      else if (node._imageHeight) styles.push(`height:${node._imageHeight}px`)
      if (styles.length) attrs.push(`style="${styles.join(';')}"`)
      html = `<img ${attrs.join(' ')} />`
    }
    return { html }
  },
  afterExecute() {
    const img = this.el?.querySelector('.widget-image-preview')
    if (img) {
      img.style.width = this._imageWidth ? `${this._imageWidth}px` : ''
      img.style.height = this._imageHeight ? `${this._imageHeight}px` : ''
    }
    this._imageWidget?.update?.()
  },
  createWidget: (node) => createImageWidget(node)
}
