# react-outlier

A robust `useClickOutside` hook for React — one small, fully-typed hook that handles the cases real apps run into.

`~1.5 kB gzipped` · zero runtime dependencies · TypeScript-first · React 16.8+

---

## Why

"Close this when the user clicks outside" sounds like a one-liner. Then the real world shows up:

- the menu is rendered through a **portal**, so it's not a DOM descendant of its trigger;
- the component lives inside a **Shadow DOM** or an **iframe**, where events don't cross the boundary;
- on **mobile**, a tap fires both `touchstart` and a synthesized `mousedown`;
- the user **selects text** starting inside and releases outside;
- a dropdown is opened **from within a modal**, and a single click should close only the top one;
- keyboard users **tab out**, and the panel should dismiss for them too.

react-outlier covers each of these, so you can wire up "dismiss on outside interaction" once and trust it.

## Features

- **Portal-aware** — uses the event's `composedPath()`, so clicks inside portals are correctly recognized as "inside".
- **Shadow DOM & iframe** — attach listeners to any roots via `rootNodes`, and treat focus moving into a same-page `<iframe>` as outside via `detectIframe`.
- **Ignore list** — mark trigger buttons or portal containers as "inside" with `ignore`.
- **Multiple elements** — pass an array of refs to treat several elements as a single "inside" region.
- **Escape key** — built-in `onEscape` callback, no extra key handling.
- **Keyboard & accessibility** — `onFocusOutside` dismisses when focus tabs away from the element.
- **Text-selection safe** — a drag that starts inside and ends outside is never mistaken for an outside click.
- **Scrollbar safe** — `excludeScrollbar` ignores clicks on the native scrollbar.
- **Layered overlays** — with `layered`, a single click or Escape dismisses only the topmost overlay.
- **Inside callback** — `onClickInside` fires the inverse of the main handler.
- **Touch / mobile** — `touchstart` with `{ passive: true }`, with the duplicate synthesized `mousedown` deduplicated.
- **Leak-free** — every listener is removed on unmount.
- **Fully typed** — strict TypeScript, no `any`.

## Install

```bash
npm install react-outlier
```

## Quick start

```tsx
import { useRef, useState } from 'react'
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

That's the whole integration: attach a ref, pass a handler. Everything below is optional.

## Recipes

### Close on Escape

```tsx
useClickOutside(ref, () => setOpen(false), {
    onEscape: () => setOpen(false),
})
```

### Ignore the trigger button

When listening on `click`, the button that opens the menu would otherwise close it immediately. Mark it as "inside":

```tsx
const menuRef = useRef<HTMLDivElement>(null)
const triggerRef = useRef<HTMLButtonElement>(null)

useClickOutside(menuRef, () => setOpen(false), {
    event: 'click',
    ignore: [triggerRef],
})
```

### React portals

A portal is rendered elsewhere in the DOM, so add its container to `ignore`:

```tsx
const menuRef = useRef<HTMLDivElement>(null)
const portalRef = useRef<HTMLDivElement>(null)

useClickOutside(menuRef, () => setOpen(false), {
    ignore: [portalRef],
})

// Clicks inside the portal won't close the menu.
createPortal(<div ref={portalRef}>...</div>, document.body)
```

### Shadow DOM / iframe roots

Events don't cross a Shadow DOM or iframe boundary, so listen on the extra roots:

```tsx
// Shadow DOM
useClickOutside(ref, handler, {
    rootNodes: [document, myElement.shadowRoot!],
})

// iframe document
useClickOutside(ref, handler, {
    rootNodes: [iframe.contentDocument ?? document],
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

Clicking into a same-page `<iframe>` fires no mouse event in the parent document; `detectIframe` catches it through `window` blur:

```tsx
useClickOutside(ref, () => setOpen(false), { detectIframe: true })
```

### Ignore scrollbar clicks

```tsx
useClickOutside(ref, () => setOpen(false), { excludeScrollbar: true })
```

### Layered overlays

In a dropdown opened from within a modal, a single outside click or Escape should close only the frontmost layer:

```tsx
useClickOutside(ref, () => setOpen(false), { layered: true })
```

A layer joins the stack while it's active. If the component unmounts when closed, that's automatic. If several layers live in one always-mounted component, gate each with `enabled` so only the open ones compete for "topmost":

```tsx
useClickOutside(outerRef, () => setOuter(false), { layered: true, enabled: outer })
useClickOutside(innerRef, () => setInner(false), { layered: true, enabled: inner })
```

### Conditional activation

```tsx
useClickOutside(ref, () => setOpen(false), { enabled: isOpen })
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
| `event` | `'mousedown' \| 'click' \| 'pointerdown' \| 'contextmenu'` | `'mousedown'` | Which event marks an outside interaction |
| `enabled` | `boolean` | `true` | Attach listeners only when true |
| `layered` | `boolean` | `false` | Only the topmost active instance dismisses on click / Escape |
| `ignore` | `RefObject<HTMLElement \| null>[]` | — | Elements treated as "inside" |
| `excludeScrollbar` | `boolean` | `false` | Ignore clicks on the native scrollbar |
| `detectIframe` | `boolean` | `false` | Treat focus moving into an outside `<iframe>` as outside |
| `onEscape` | `(e: KeyboardEvent) => void` | — | Called on the Escape key |
| `onFocusOutside` | `(e: FocusEvent) => void` | — | Called when focus moves outside (tab-out) |
| `onClickInside` | `(e: MouseEvent \| PointerEvent \| TouchEvent) => void` | — | Called when the interaction lands inside |
| `rootNodes` | `(Document \| ShadowRoot)[]` | `[document]` | Roots to attach listeners to |

The default `event: 'mousedown'` fires before the `click` event, which avoids a race with toggle buttons.

## How it works

A single set of listeners is attached per root and shares one "is this outside?" decision based on the event's composed path — the reason portals and Shadow DOM are handled without special-casing. Your handlers and refs are read fresh at event time, so passing new inline callbacks each render never re-attaches listeners. Layered instances coordinate through a small shared stack so only the frontmost one reacts. On unmount, every listener is cleaned up.

## Requirements

React 16.8 or newer.

## License

MIT
