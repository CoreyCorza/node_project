# HTML Interface Builder Design Plan

Design plan for the node-based HTML/CSS/JS interface builder. Reference for implementation and alignment.

---

## 1. Purpose and Scope

- **Project goal**: Visual node editor for building HTML interfaces. A compiler takes the graph and outputs complete HTML (later: CSS, JS).
- **Phase 1**: HTML only. CSS and JS deferred until HTML node design is settled.
- **Key shift**: Current graph is data-flow (values pass through noodles). HTML graph is structure-flow (connections define document hierarchy).

---

## 2. Node vs Property Decision Framework

When is something a node vs a property on a node:

| Criterion | Node | Property |
|-----------|------|----------|
| Has children / can contain other elements | Node with input sockets | — |
| Standalone semantic unit (h1, p, div) | Node | — |
| Configuration of a parent (meta, title) | — | Property on parent |
| Repeated / variable number of items | Node (connect multiple) | — |
| Fixed, small set of options | — | Property (dropdown, toggle) |

**Examples:**
- `<head>`: One node. `meta charset`, `meta viewport`, `title` = properties on the head node.
- `<body>`: One node. Children = nodes connected to body's input socket(s).
- `<h1>`, `<p>`: Individual nodes. Connect to body to place inside body.

---

## 3. HTML Node Types (Phase 1)

| Node | Sockets | Properties | Output |
|------|---------|------------|--------|
| **Document** | — | (implicit root) | Wraps head + body |
| **Head** | — | charset, viewport, title | `<head>...</head>` |
| **Body** | children (multi) | — | `<body>...</body>` |
| **H1** | — | text | `<h1>text</h1>` |
| **P** | — | text | `<p>text</p>` |
| **Div** | children (multi) | — | `<div>...</div>` |
| **Span** | children (multi) | — | `<span>...</span>` |
| **A** | children (multi) | href, target | `<a href="...">...</a>` |
| **Img** | — | src, alt, width, height | `<img src="..." alt="..." />` |
| *(others as needed)* | | | |

**Body elements:** Phase 1 treats body content as highly modular — div, span, a, img, etc. each get their own node. Tag attributes (e.g. `src`, `alt` on img; `href` on a) are properties on that node, not separate nodes.

**Socket semantics:**
- **Child socket**: Accepts connections from element nodes. Order of connections = order of children in output.
- **Data type**: It's all strings under the hood. No special `html-element` type — just `string` (or a semantic alias).

**Socket colors (visual categorization):**
- `html` — blue
- `js` — yellow
- `css` — white (or similar)

Connection rules can stay simple (e.g. html-to-html, js-to-js). Mostly aesthetic.

---

## 4. Compiler Behavior

```
Graph (nodes + connections)  →  Compiler  →  Raw HTML string  →  Prettier  →  Formatted HTML file
```

**Process:**
1. Find root nodes (Document, or Head + Body as entry points).
2. For each node, read its properties and gather connected children.
3. Recursively serialize: open tag, children content, close tag.
4. Output raw HTML (concatenate tags, no indentation).
5. Pass through Prettier for formatting.

**Formatting**: Use **Prettier** for all formatting. Compiler outputs raw; Prettier formats. Same approach for CSS and JS when those phases land — one formatter for everything. Bundle size (~3MB) is acceptable.

---

## 5. Relationship to Current Architecture

The existing [GRAPH_ARCHITECTURE.md](GRAPH_ARCHITECTURE.md) describes a **data-flow** execution model. The HTML builder introduces a **structure-flow** model:

| Aspect | Current (data-flow) | HTML builder (structure-flow) |
|--------|---------------------|--------------------------------|
| Connection meaning | Value passes from output to input | Child is placed inside parent |
| Execution | Topological sort, compute values | Traverse tree, serialize structure |
| Socket types | float, string, bool, etc. | string (semantic: html, js, css for color only) |
| Output | `socket.value` after execute | Compiled HTML string |

**Integration options:**
- **A)** Extend current graph: add HTML-specific node types and a separate "compile" path alongside execute.
- **B)** Separate graph mode: "data graph" vs "structure graph" with different semantics.
- **C)** Unified: compiler is a different "execute" that traverses structure instead of data flow.

---

## 6. Node Flags / Compiler Metadata

Nodes (and possibly connections) carry **explicit flags** so the compiler doesn't have to infer behavior. The compiler reads these flags and knows how to retrieve information and create output.

**Node type flags** — each node type defines how the compiler behaves:
- `role`: e.g. `document-root`, `container`, `leaf` — tells compiler how to traverse.
- `output`: how to serialize (e.g. `tag` for elements, `text` for text nodes).
- Other type-specific flags as needed.

**Connection/child ordering** — connections store explicit order:
- Each connection has an `index` or `order` flag (e.g. 0, 1, 2). Compiler sorts children by this. No inference.
- Or: the socket has multiple named inputs (`child-0`, `child-1`, …) — less flexible but explicit.

**Principle**: Compiler is dumb. It reads flags. No "figure shit out" logic — if the node type says "I'm a container, my children are ordered by connection.index", the compiler just does that.

---

## 7. Open Questions / TBD

- Exact flag schema (e.g. `node.compilerFlags`, `connection.index`).

**Compiled output (decided):** Start with a preview panel. Main window is split — either horizontally (node-graph left, preview right) or vertically (node-graph below, preview above). User can choose split orientation. Eventually: popout preview window.
