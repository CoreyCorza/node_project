# Node Graph Architecture

Documentation for the node graph system: data model, execution, and APIs.

---

## Overview

The graph is a directed acyclic graph (DAG) of **nodes** connected by **noodles**. Each node has **sockets** (inputs and outputs). Data flows from output sockets to input sockets via noodles. Execution runs nodes in topological order and propagates values.

---

## Core Classes

### Graph

Orchestrates the canvas, nodes, noodles, pan/zoom, selection, and persistence.

| Property | Description |
|----------|-------------|
| `nodes` | Array of Node instances |
| `noodles` | Array of Noodle instances (connections) |
| `containerEl` | DOM container for the graph |
| `noodleStyle` | `'smooth'` or `'linear'` – bezier vs straight noodles |
| `storageKey` | localStorage key for graph state (`node-graph-state`) |
| `clipboard` | `{ nodes, connections }` or `null` – copied nodes for paste |

**Key methods:**

| Method | Description |
|--------|-------------|
| `addNode(title, x, y, options)` | Add a node. Options: `id`, `width`, `height`, `nodeTypeId`, `inputs`, `outputs`, `computeFn`, `createWidget` |
| `removeNode(node)` | Remove node and all its connections |
| `serialize()` | Return `{ nodes, connections }` for persistence |
| `load(data)` | Restore graph from serialized data |
| `execute()` | Run the graph. Returns `{ ok: true }` or `{ ok: false, error }` |
| `getExecutionOrder()` | Topological sort. Returns `Node[]` or `null` if cycles exist |
| `hasCycles()` | `true` if graph contains cycles |
| `getUpstreamNodes(node)` | Nodes that feed into this node |
| `getDownstreamNodes(node)` | Nodes this node feeds into |
| `setNoodleStyle(style)` | Set `'smooth'` or `'linear'`. Persists to `node-graph-settings` |
| `copySelectedNodes()` | Copy selected nodes and their connections to clipboard |
| `pasteNodes()` | Paste clipboard at view center. New nodes are selected |

---

### Node

Represents a single node in the graph.

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `title` | Display title |
| `x`, `y` | Position in graph coordinates |
| `width`, `height` | Size |
| `nodeTypeId` | Optional. References a type in `NODE_TYPES` |
| `computeFn` | Optional. `(inputs) => outputs` |
| `createWidget` | Optional. `(node) => HTMLElement` for widget section |
| `afterExecute` | Optional. Called after `compute()` |
| `inputs` | Array of Socket (input) |
| `outputs` | Array of Socket (output) |

**Methods:**

| Method | Description |
|--------|-------------|
| `compute(inputs)` | Run computation. `inputs` is `{ socketId: value }`. Returns `{ socketId: value }` for outputs. Uses `computeFn` if set, else pass-through (first input → all outputs) |
| `addInputSocket(id, label, dataType)` | Add input socket |
| `addOutputSocket(id, label, dataType)` | Add output socket |
| `setPosition(x, y)` | Update position |
| `setSize(w, h, minW, minH)` | Update size |

**Node layout:** Each node is organized into two main parts within the body:

1. **Sockets row** (top) – `.node-sockets-row` contains inputs on the left, a drag zone in the middle, and outputs on the right. This is always present.
2. **Widget section** (bottom) – `.node-widget-section` contains `.node-widget`, which holds the type-specific UI (e.g. boolean toggle, file path, debug output). Only present when the node type defines `createWidget`.

```
┌─ node ─────────────────────┐
│  node-header (title)         │
├─────────────────────────────┤
│  node-body                   │
│  ┌─ node-sockets-row ──────┐ │
│  │ inputs │ drag │ outputs │ │  ← sockets at top
│  └─────────────────────────┘ │
│  ┌─ node-widget-section ────┐ │
│  │ node-widget (optional)  │ │  ← widget at bottom
│  └─────────────────────────┘ │
│  node-resize-handle           │
└──────────────────────────────┘
```

---

### Socket

Input or output port on a node.

| Property | Description |
|----------|-------------|
| `node` | Parent Node |
| `type` | `'input'` or `'output'` |
| `id` | Socket identifier (unique within node) |
| `label` | Display label |
| `dataType` | One of: `default`, `float`, `integer`, `string`, `bool`, `any` |
| `connections` | Array of Noodle instances |
| `value` | Runtime value after `execute()` |

**Rules:**
- Input sockets: max 1 connection (dropping a new noodle on an occupied input replaces the existing connection)
- Output sockets: unlimited connections

---

### Noodle

Visual and logical connection between two sockets.

| Property | Description |
|----------|-------------|
| `fromSocket` | Output socket (or null when dragging from input) |
| `toSocket` | Input socket (or null when dragging from output) |
| `graph` | Parent Graph |

**Visual behavior:**
- Bezier curves use directional control points (out from socket, then toward target)
- When typed socket connects to `any` socket: gradient stroke between the two colors
- `graph.noodleStyle` controls `'smooth'` (bezier) vs `'linear'` (straight line)

---

## Copy & Paste

**Ctrl+C / Cmd+C**: Copy selected nodes and their connections (only between selected nodes) to the graph clipboard.

**Ctrl+V / Cmd+V**: Paste clipboard at mouse location (or view center if mouse was never over the graph). Pasted nodes get new IDs and are selected. Connections between pasted nodes are restored. Node-specific state (e.g. `booleanValue`, `selectedFilePath`) is preserved.

**Delete / Backspace / X**: Delete selected nodes.

---

## Socket Types & Connection Rules

**Data types:** `default`, `float`, `integer`, `string`, `bool`, `any`

**`canConnect(fromSocket, toSocket)`** (in `socket-types.js`):

- `fromSocket` must be output, `toSocket` must be input
- Type compatibility:
  - `any` on either side → allowed
  - Otherwise types must match
- Occupied inputs are allowed; dropping replaces the existing connection

---

## Node Type Registry

**`NODE_TYPES`** (in `nodes/index.js`):

Node types: `load-file`, `debug`, `float`, `string`, `integer`, `bool`, `test`.

```js
{
  id: 'bool',
  title: 'Bool Node',
  inputs: [],
  outputs: [{ id: 'out', label: 'bool', dataType: 'bool' }],
  compute: (inputs, node) => ({ out: node?.booleanValue ?? false }),
  createWidget: (node) => createBooleanWidget(node, { label: 'value' })
}
```

**`getNodeType(typeId)`** – returns the type definition or `null`.

When adding a node with `nodeTypeId`, the type’s `inputs`, `outputs`, `compute`, and `createWidget` are used unless overridden in options. Node-specific state (e.g. `booleanValue`, `selectedFilePath`) is stored on the node instance and persisted in serialization.

---

## Execution

**`graph.execute()`**:

1. Clear all socket values
2. Compute execution order: `getExecutionOrder()` (topological sort)
3. If cycles exist → return `{ ok: false, error: 'Graph contains cycles' }`
4. For each node in order:
   - Build `inputs`: for each input socket, get value from connected noodle’s `fromSocket.value`
   - Call `node.compute(inputs)`
   - Write `outputs[socketId]` to each output socket’s `value`

**Reading results:** After `execute()`, read `socket.value` on output sockets.

---

## Graph Topology

**`graph-topology.js`**:

| Function | Description |
|----------|-------------|
| `getExecutionOrder(nodes, noodles)` | Topological sort. Returns `Node[]` or `null` if cycles |
| `hasCycles(nodes, noodles)` | `true` if cycles exist |
| `getUpstreamNodes(node, noodles)` | Nodes that feed into this node |
| `getDownstreamNodes(node, noodles)` | Nodes this node feeds into |

---

## Serialization Format

**Graph state** (`node-graph-state`): nodes and connections.

**Settings** (`node-graph-settings`): `{ noodleStyle: 'smooth' | 'linear' }`.

```json
{
  "nodes": [
    {
      "id": "node-abc",
      "title": "Float Node",
      "x": 100,
      "y": 200,
      "width": 180,
      "height": 0,
      "nodeTypeId": "float",
      "inputs": [{ "id": "in", "label": "float", "dataType": "float" }],
      "outputs": [{ "id": "out", "label": "float", "dataType": "float" }],
      "booleanValue": true,
      "selectedFilePath": "/path/to/file"
    }
  ],
  "connections": [
    {
      "fromNode": "node-a",
      "fromSocket": "out",
      "toNode": "node-b",
      "toSocket": "in"
    }
  ]
}
```

---

## File Structure

```
src/
├── css/
│   ├── base.css
│   ├── node-graph.css
│   ├── node.css
│   ├── socket.css
│   ├── noodles.css
│   └── widgets/
│       ├── index.css
│       ├── boolean.css
│       ├── load-file.css
│       └── debug.css
├── js/graph/
│   ├── Graph.js          # Main orchestrator
│   ├── Node.js           # Node class
│   ├── Socket.js         # Socket class
│   ├── nodes/
│   │   ├── index.js      # NODE_TYPES registry
│   │   ├── LoadFile.js
│   │   ├── Debug.js
│   │   ├── FloatNode.js
│   │   ├── StringNode.js
│   │   ├── IntegerNode.js
│   │   ├── BoolNode.js
│   │   └── TestNode.js
│   ├── widgets/
│   │   ├── index.js
│   │   ├── BooleanWidget.js
│   │   ├── LoadFileWidget.js
│   │   └── DebugWidget.js
│   ├── noodles/
│   │   ├── Noodle.js
│   │   └── index.js
│   ├── socket-types.js   # SOCKET_TYPES, canConnect, SOCKET_COLORS, gradient helpers
│   ├── graph-topology.js # Execution order, cycle detection
│   └── index.js          # Public exports
└── main.js
```

---

## Usage Example

```js
import { Graph, getNodeType } from './js/graph/index.js'

const graph = new Graph(containerEl)

// Add typed node
graph.addNode('Float Node', 100, 100, { nodeTypeId: 'float' })

// Add custom node
graph.addNode('Custom', 200, 100, {
  inputs: [{ id: 'a', label: 'a', dataType: 'float' }],
  outputs: [{ id: 'out', label: 'out', dataType: 'float' }],
  computeFn: (inputs) => ({ out: (inputs.a ?? 0) * 2 })
})

// Execute
const result = graph.execute()
if (result.ok) {
  const outputSocket = someNode.outputs[0]
  console.log(outputSocket.value)
}
```
