# Widget System

Widgets are reusable UI components. Each widget is defined once in its own file and instanced wherever needed — on graph nodes, in the toolbar, in settings, or anywhere in the interface.

## Rules

1. **One widget per file.** Every widget gets its own JS file and its own CSS file.
2. **No duplication.** If two nodes need a boolean toggle, they both use `createBooleanWidget`. Nobody hand-rolls their own toggle.
3. **Composable.** Complex widgets (like InputWidget) compose simpler widgets. They import and instance them, they don't copy the code.
4. **Consistent API.** All widget factories follow the same pattern: `createXWidget(state, options)` → `HTMLElement`.
5. **State via keys.** Widgets bind to a state object via `valueKey` so the same widget can read/write different properties on different nodes.

## File Structure

```
src/
├── js/graph/widgets/          # Widget JS (one file per widget)
│   ├── index.js               # Re-exports everything
│   ├── BooleanWidget.js       # Toggle switch
│   ├── StringWidget.js        # Text input
│   ├── IntegerWidget.js       # Integer input with scrub
│   ├── FloatWidget.js         # Float input with scrub
│   ├── DropdownWidget.js      # Select dropdown
│   ├── DecimalsWidget.js      # Precision selector (scroll to adjust)
│   ├── LoadFileWidget.js      # File picker
│   └── DebugWidget.js         # Debug output display
│
├── css/widgets/               # Widget CSS (one file per widget)
│   ├── index.css              # Imports everything
│   ├── row.css                # Shared .widget-row + .widget-label layout
│   ├── boolean.css            # Toggle track/knob styles
│   ├── string.css             # Text field styles
│   ├── integer.css            # Integer field + scrub styles
│   ├── float.css              # Float field + scrub styles
│   ├── dropdown.css           # Dropdown trigger + menu styles
│   ├── decimals.css           # Decimals display styles
│   ├── load-file.css          # File picker styles
│   ├── debug.css              # Debug output styles
│   └── tooltip.css            # Shared tooltip styles
```

## Widget API Pattern

Every widget factory function follows this shape:

```js
export function createXWidget(state, options = {}) {
  const valueKey = options.valueKey ?? 'defaultKey'
  // Initialize default if missing
  if (state[valueKey] === undefined) state[valueKey] = defaultValue

  const wrap = document.createElement('div')
  wrap.className = 'widget-x widget-row'

  // Optional label
  if (options.label) {
    const label = document.createElement('span')
    label.className = 'widget-label'
    label.textContent = options.label
    wrap.appendChild(label)
  }

  // ... widget-specific DOM ...

  // Stop events from propagating to graph (drag/pan)
  someEl.addEventListener('mousedown', (e) => e.stopPropagation())
  someEl.addEventListener('pointerdown', (e) => e.stopPropagation())

  // Optional callback
  options.onChange?.()

  return wrap
}
```

**Parameters:**
- `state` — Any object. The widget reads/writes `state[valueKey]`. This can be a graph node, a plain object, anything.
- `options.valueKey` — Which property to bind to (default varies per widget).
- `options.label` — Optional label text.
- `options.onChange` — Optional callback fired on value change.
- Widget-specific options as needed (e.g. `tooltip`, `placeholder`, `step`, `items`).

## Usage Examples

### On a graph node

```js
// BoolNode uses the shared boolean widget
import { createBooleanWidget } from '../widgets/index.js'

export const BoolNode = {
  id: 'bool',
  createWidget: (node) => createBooleanWidget(node, { label: 'value' })
}
```

### In the settings UI

```js
// Settings tooltips toggle — same widget, plain state object
const state = { tooltips: true }
const toggle = createBooleanWidget(state, {
  label: 'Tooltips',
  valueKey: 'tooltips',
  onChange: () => { /* persist to localStorage */ }
})
container.appendChild(toggle)
```

### Node-level widget composition

Nodes that need multiple widgets compose them in their `createWidget` function.
There is no "InputWidget" — the Input node definition imports and arranges individual widgets:

```js
// GenericNode.js (Input node definition)
import {
  createBooleanWidget, createStringWidget, createFloatWidget,
  createIntegerWidget, createDropdownWidget, createDecimalsWidget
} from '../widgets/index.js'

function buildInputNodeWidget(node) {
  const dropdown = createDropdownWidget({ items, value, onChange: applyType })
  // dropdown controls which widget is shown:
  // applyType('bool')    → appendChild(createBooleanWidget(...))
  // applyType('integer') → appendChild(createIntegerWidget(...))
  // applyType('float')   → appendChild(createFloatWidget(...))
  // applyType('string')  → appendChild(createStringWidget(...))
}
```

The key principle: **widgets are leaf components, nodes orchestrate them.**

## Adding a New Widget

1. Create `src/js/graph/widgets/MyWidget.js` with `export function createMyWidget(state, options)`
2. Create `src/css/widgets/my-widget.css` with `.widget-my-*` classes
3. Add the CSS import to `src/css/widgets/index.css`
4. Add the JS export to `src/js/graph/widgets/index.js`
5. Use it anywhere: `import { createMyWidget } from './widgets/index.js'`

## CSS Conventions

- Shared layout: `.widget-row` (flex row), `.widget-label` (label text) — defined in `row.css`
- Widget-specific classes: `.widget-{name}-*` (e.g. `.widget-boolean-toggle`, `.widget-float-scrub`)
- Tooltip wrap: `.widget-tooltip-wrap` + `.widget-tooltip` — defined in `tooltip.css`
- Each widget CSS file only contains styles for that widget. No cross-widget styles.

## Current Widget Inventory

| Widget | JS | CSS | Used By |
|---|---|---|---|
| Boolean | `BooleanWidget.js` | `boolean.css` | BoolNode, InputWidget (bool mode), settings toggle |
| String | `StringWidget.js` | `string.css` | StringNode, InputWidget (string mode) |
| Integer | `IntegerWidget.js` | `integer.css` | IntegerNode, InputWidget (integer mode) |
| Float | `FloatWidget.js` | `float.css` | FloatNode, InputWidget (float mode) |
| Dropdown | `DropdownWidget.js` | `dropdown.css` | InputWidget (type selector) |
| Decimals | `DecimalsWidget.js` | `decimals.css` | InputWidget (float precision) |
| Load File | `LoadFileWidget.js` | `load-file.css` | LoadFile node |
| Debug | `DebugWidget.js` | `debug.css` | Debug node |


The Input node (`GenericNode.js`) composes Dropdown + String/Float/Integer/Boolean widgets.
It is a node, not a widget — the orchestration logic lives in the node definition.
