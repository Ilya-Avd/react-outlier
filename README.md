# react-outlier

Robust `useClickOutside` hook for React. Handles the edge cases most libraries miss.

## Features

- **Portal support** — uses `composedPath()` instead of `contains()`, correctly handles elements removed from DOM on click
- **Shadow DOM / iframe** — `rootNodes` option for custom event roots, plus `detectIframe` for focus moving into a same-page `<iframe>`
- **ignore refs** — exclude trigger buttons and portal containers from "outside" detection
- **Multiple elements** — pass an array of refs to treat several elements as "inside"
- **Escape key** — built-in `onEscape` callback
- **Focus / keyboard** — `onFocusOutside` dismisses when focus tabs out (accessibility)
- **Text-selection safe** — a press that starts inside and drags out won't be treated as an outside click
- **Scrollbar safe** — `excludeScrollbar` ignores clicks on the native scrollbar
- **Layered dismissal** — `layered` ensures only the topmost overlay closes on a single click / Escape
- **Inside callback** — `onClickInside` is the inverse of the main handler
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

### Multiple "inside" elements

```tsx
const panelRef = useRef<HTMLDivElement>(null)
const handleRef = useRef<HTMLDivElement>(null)

// A click on either element counts as "inside".
useClickOutside([panelRef, handleRef], () => setOpen(false))
```

### Close on tab-out (accessibility)

```tsx
useClickOutside(ref, () => setOpen(false), {
    onFocusOutside: () => setOpen(false),
})
```

### Detect clicks into an iframe

```tsx
// Clicking into a same-page <iframe> doesn't fire a mouse event in the parent
// document; detectIframe catches it via window blur.
useClickOutside(ref, () => setOpen(false), { detectIframe: true })
```

### Ignore scrollbar clicks

```tsx
useClickOutside(ref, () => setOpen(false), { excludeScrollbar: true })
```

### Layered overlays

```tsx
// In a dropdown opened from within a modal, only the topmost layer closes
// on a single outside click / Escape.
useClickOutside(ref, () => setOpen(false), { layered: true })
```

### Right-click outside

```tsx
useClickOutside(ref, () => setOpen(false), { event: 'contextmenu' })
```

## API

```ts
useClickOutside(
    ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
    handler: (event: MouseEvent | PointerEvent | TouchEvent | FocusEvent) => void,
    options?: UseClickOutsideOptions
): void
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `event` | `'mousedown' \| 'click' \| 'pointerdown' \| 'contextmenu'` | `'mousedown'` | Mouse event to listen to |
| `enabled` | `boolean` | `true` | Attach listeners only when true |
| `layered` | `boolean` | `false` | Only the topmost active instance dismisses on click / Escape |
| `ignore` | `RefObject<HTMLElement \| null>[]` | — | Elements treated as "inside" |
| `excludeScrollbar` | `boolean` | `false` | Ignore clicks on the native scrollbar |
| `detectIframe` | `boolean` | `false` | Treat focus moving into an outside `<iframe>` as outside |
| `onEscape` | `(e: KeyboardEvent) => void` | — | Called on Escape key |
| `onFocusOutside` | `(e: FocusEvent) => void` | — | Called when focus moves outside (tab-out) |
| `onClickInside` | `(e: MouseEvent \| PointerEvent \| TouchEvent) => void` | — | Called when the interaction lands inside |
| `rootNodes` | `(Document \| ShadowRoot)[]` | `[document]` | Roots to attach listeners to |

## Requirements

React 16.8+
