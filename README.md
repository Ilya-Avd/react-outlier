# react-outlier

Robust `useClickOutside` hook for React. Handles the edge cases most libraries miss.

## Features

- **Portal support** — uses `composedPath()` instead of `contains()`, correctly handles elements removed from DOM on click
- **Shadow DOM / iframe** — `rootNodes` option for custom event roots
- **ignore refs** — exclude trigger buttons and portal containers from "outside" detection
- **Escape key** — built-in `onEscape` callback
- **Touch / mobile** — `touchstart` with `{ passive: true }`, deduplicates synthesized `mousedown`
- **No memory leaks** — listeners are always removed on unmount
- **TypeScript** — fully typed, zero `any`

## Install

```bash
npm install react-outlier
```

## Usage

### Basic

```tsx
import { useRef } from 'react'
import { useClickOutside } from 'react-outlier'

function Dropdown() {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useClickOutside(ref, () => setOpen(false))

    return (
        <>
            <button onClick={() => setOpen(true)}>Open</button>
            {open && <div ref={ref}>Menu content</div>}
        </>
    )
}
```

### Escape key

```tsx
useClickOutside(ref, () => setOpen(false), {
    onEscape: () => setOpen(false),
})
```

### Ignore trigger button

```tsx
const menuRef = useRef<HTMLDivElement>(null)
const triggerRef = useRef<HTMLButtonElement>(null)

useClickOutside(menuRef, () => setOpen(false), {
    event: 'click',
    ignore: [triggerRef],
})
```

### React Portal

```tsx
const menuRef = useRef<HTMLDivElement>(null)
const portalRef = useRef<HTMLDivElement>(null)

useClickOutside(menuRef, () => setOpen(false), {
    ignore: [portalRef],
})

// Clicks inside the portal won't close the menu
createPortal(<div ref={portalRef}>...</div>, document.body)
```

### Shadow DOM / iframe

```tsx
// Shadow DOM
useClickOutside(ref, handler, {
    rootNodes: [document, myElement.shadowRoot!],
})

// iframe
useClickOutside(ref, handler, {
    rootNodes: [iframe.contentDocument ?? document],
})
```

### Conditional activation

```tsx
useClickOutside(ref, () => setOpen(false), {
    enabled: isOpen,
})
```

## API

```ts
useClickOutside(
    ref: RefObject<HTMLElement | null>,
    handler: (event: MouseEvent | PointerEvent | TouchEvent) => void,
    options?: UseClickOutsideOptions
): void
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `event` | `'mousedown' \| 'click' \| 'pointerdown'` | `'mousedown'` | Mouse event to listen to |
| `enabled` | `boolean` | `true` | Attach listeners only when true |
| `ignore` | `RefObject<HTMLElement \| null>[]` | — | Elements treated as "inside" |
| `onEscape` | `(e: KeyboardEvent) => void` | — | Called on Escape key |
| `rootNodes` | `(Document \| ShadowRoot)[]` | `[document]` | Roots to attach listeners to |

## Requirements

React 16.8+
