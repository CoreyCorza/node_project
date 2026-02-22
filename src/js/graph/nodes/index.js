import { LoadFile } from './LoadFile.js'
import { Debug } from './Debug.js'
import { FloatNode } from './FloatNode.js'
import { StringNode } from './StringNode.js'
import { IntegerNode } from './IntegerNode.js'
import { BoolNode } from './BoolNode.js'
import { TestNode } from './TestNode.js'
import { InputNode } from './InputNode.js'
import { ImageNode } from './ImageNode.js'
import { ErrorNode } from './ErrorNode.js'
import { DivNode } from './DivNode.js'

const nodeDefs = [LoadFile, Debug, FloatNode, StringNode, IntegerNode, BoolNode, TestNode, InputNode, ImageNode, ErrorNode, DivNode]

export const NODE_TYPES = Object.fromEntries(nodeDefs.map(d => [d.id, d]))

export function getNodeType(typeId) {
  return NODE_TYPES[typeId] ?? null
}
