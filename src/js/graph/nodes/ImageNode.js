import { convertFileSrc } from '@tauri-apps/api/core'
import { createImageWidget } from '../widgets/index.js'

export const ImageNode = {
  id: 'image',
  title: 'Image',
  resizableW: true,
  resizableH: true,
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
    node._imageWidth = inputs.width ?? (widgetW || null)
    node._imageHeight = inputs.height ?? (widgetH || null)

    let html = ''
    if (pickerPath) {
      const attrs = [`src="${pickerPath}"`]
      const altText = node.imageAltEnabled ? (node.imageAltText ?? '') : ''
      attrs.push(`alt="${altText}"`)
      if (node._imageWidth) attrs.push(`width="${node._imageWidth}"`)
      if (node._imageHeight) attrs.push(`height="${node._imageHeight}"`)
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
