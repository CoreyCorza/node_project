import { LoadFile } from './LoadFile.js'
import { Debug } from './Debug.js'
import { FloatNode } from './FloatNode.js'
import { StringNode } from './StringNode.js'
import { IntegerNode } from './IntegerNode.js'
import { BoolNode } from './BoolNode.js'
import { TestNode } from './TestNode.js'
import { InputNode } from './GenericNode.js'

const nodeDefs = [LoadFile, Debug, FloatNode, StringNode, IntegerNode, BoolNode, TestNode, InputNode]

export const NODE_TYPES = Object.fromEntries(nodeDefs.map(d => [d.id, d]))

export function getNodeType(typeId) {
  return NODE_TYPES[typeId] ?? null
}
