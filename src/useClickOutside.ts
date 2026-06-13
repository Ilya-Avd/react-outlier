import { useEffect, useRef, type RefObject } from 'react'

// Module-level stack of active "layered" instances, ordered by mount time so the
// last-opened overlay sits on top. When `layered` is set, only the instance on top
// of this stack reacts to an outside click / Escape — so a single click or Escape
// dismisses just the topmost dropdown/modal instead of every open one at once.
const layerStack: symbol[] = []

export interface UseClickOutsideOptions {
    /**
     * Which event to listen to. Defaults to 'mousedown' so the handler fires
     * before the click event — prevents race conditions with toggle buttons.
     * Use 'contextmenu' to dismiss on a right-click outside.
     */
    event?: 'mousedown' | 'click' | 'pointerdown' | 'contextmenu'
    /** When false the listener is not attached. Useful for conditional activation. */
    enabled?: boolean
    /**
     * Opt into layered dismissal. When several layered instances are active at once
     * (e.g. a dropdown opened from within a modal), only the most recently mounted
     * one reacts to an outside click or Escape. Without this every open layer would
     * dismiss on a single interaction.
     */
    layered?: boolean
    /**
     * Ignore clicks that land on the browser's native scrollbar. A scrollbar click
     * reports coordinates outside the page's client area, so it would otherwise be
     * treated as an outside click and dismiss the element — a common annoyance when
     * scrolling a long dropdown. Only affects mouse/pointer events.
     */
    excludeScrollbar?: boolean
    /**
     * Also treat focus moving into a same-page <iframe> as an outside interaction.
     * Clicking inside an iframe does NOT dispatch a mouse event in the parent
     * document, so the pointer listeners never see it. When true, a window `blur`
     * whose resulting `document.activeElement` is an outside iframe calls `handler`.
     */
    detectIframe?: boolean
    /**
     * Refs to elements that should be treated as "inside" even if they are
     * outside the watched element in the DOM. Typical uses:
     *   - trigger button that opens the dropdown (when using 'click' event)
     *   - React portal container rendered elsewhere in the DOM tree
     */
    ignore?: RefObject<HTMLElement | null>[]
    /**
     * Called when the Escape key is pressed. Kept separate from the main handler
     * so callers don't have to narrow the event type with instanceof checks.
     */
    onEscape?: (event: KeyboardEvent) => void
    /**
     * Called when focus moves to an element outside the watched element (and not
     * in `ignore`). Covers the keyboard case the pointer listeners miss: tabbing
     * out of a dropdown should dismiss it. Listens to `focusin`, so it fires for
     * both mouse- and keyboard-driven focus changes.
     */
    onFocusOutside?: (event: FocusEvent) => void
    /**
     * Called when the interaction lands inside the watched element — the inverse of
     * `handler`. Uses the same configured `event`/touch listeners, so you don't need
     * a separate onClick on the element.
     */
    onClickInside?: (event: MouseEvent | PointerEvent | TouchEvent) => void
    /**
     * Root nodes to attach listeners to. Defaults to [document].
     * Pass additional roots when your component lives inside a Shadow DOM or
     * an iframe — events don't cross those boundaries, so the default document
     * listener would never fire.
     *
     * @example Shadow DOM
     * rootNodes={[document, myShadowRoot]}
     *
     * @example iframe
     * rootNodes={[iframe.contentDocument ?? document]}
     */
    rootNodes?: (Document | ShadowRoot)[]
}

export function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null> | RefObject<T | null>[],
    handler: (event: MouseEvent | PointerEvent | TouchEvent | FocusEvent) => void,
    options: UseClickOutsideOptions = {}
): void {
    const {
        event = 'mousedown',
        enabled = true,
        ignore,
        onEscape,
        onFocusOutside,
        onClickInside,
        detectIframe = false,
        excludeScrollbar = false,
        layered = false,
        rootNodes,
    } = options

    // Stable identity for this instance's slot in the module-level layer stack.
    const layerIdRef = useRef<symbol | null>(null)
    if (layerIdRef.current === null) layerIdRef.current = Symbol('clickOutsideLayer')

    // Keep callbacks, ignore and the watched refs in refs so the effects don't re-run
    // when they change. ignore (and an array `ref`) get recreated on every render, so a
    // ref is the right approach — and lets the listeners read the latest value lazily.
    const handlerRef = useRef(handler)
    const ignoreRef = useRef(ignore)
    const onEscapeRef = useRef(onEscape)
    const onFocusOutsideRef = useRef(onFocusOutside)
    const onClickInsideRef = useRef(onClickInside)
    const refsRef = useRef<RefObject<T | null>[]>([])
    useEffect(() => {
        handlerRef.current = handler
        ignoreRef.current = ignore
        onEscapeRef.current = onEscape
        onFocusOutsideRef.current = onFocusOutside
        onClickInsideRef.current = onClickInside
        // Accept either a single ref or an array of "inside" elements.
        refsRef.current = Array.isArray(ref) ? ref : [ref]
    })

    // Register/unregister this instance in the layer stack while it's active.
    // Pushed on mount so the newest active layer ends up on top.
    useEffect(() => {
        if (!enabled || !layered) return
        const id = layerIdRef.current!
        layerStack.push(id)
        return () => {
            const i = layerStack.indexOf(id)
            if (i !== -1) layerStack.splice(i, 1)
        }
    }, [enabled, layered])

    useEffect(() => {
        if (!enabled) return

        const roots = rootNodes ?? [document]

        // Timestamp of the last touchstart. Used to suppress the synthesized mousedown
        // that mobile browsers fire ~300ms after a touch — without this the handler
        // would fire twice on every tap.
        let lastTouchTime = 0

        // Whether the current pointer gesture started inside the watched element.
        // Only meaningful for event='click': a user can press inside (e.g. to select
        // text), drag out and release outside — the browser then fires a 'click' on
        // the outside target. Without this guard that selection-drag would be treated
        // as an outside click and close the element. Tracked via a capture-phase
        // pointerdown so it's recorded before the click is synthesized.
        let pointerStartedInside = false

        // Only the topmost layer dismisses (no-op unless `layered`).
        function atTop(): boolean {
            return !layered || layerStack[layerStack.length - 1] === layerIdRef.current
        }

        function isOutside(path: EventTarget[]): boolean {
            if (!atTop()) return false
            const els = refsRef.current.map((r) => r.current).filter((el): el is T => el !== null)
            // Nothing mounted yet — treat as "not outside" so the handler stays quiet.
            if (els.length === 0) return false
            if (els.some((el) => path.includes(el))) return false
            if (
                ignoreRef.current?.some((r) => {
                    const ignoreEl = r.current
                    return ignoreEl !== null && path.includes(ignoreEl)
                })
            )
                return false
            return true
        }

        // Whether the event landed on one of the watched elements (genuine inside hit,
        // as opposed to an ignored element or a non-top layer).
        function hitsInside(path: EventTarget[]): boolean {
            return refsRef.current.some((r) => r.current !== null && path.includes(r.current))
        }

        function downListener(e: PointerEvent): void {
            pointerStartedInside = !isOutside(e.composedPath())
        }

        function touchListener(e: TouchEvent): void {
            lastTouchTime = Date.now()
            const path = e.composedPath()
            if (isOutside(path)) handlerRef.current(e)
            else if (onClickInsideRef.current && hitsInside(path)) onClickInsideRef.current(e)
        }

        function onScrollbar(e: MouseEvent | PointerEvent): boolean {
            const root = document.documentElement
            // Client area excludes the scrollbar; coordinates beyond it = scrollbar.
            return e.clientX > root.clientWidth || e.clientY > root.clientHeight
        }

        function mouseListener(e: MouseEvent | PointerEvent): void {
            // Skip synthesized mouse event that follows a real touch within 500 ms.
            if (Date.now() - lastTouchTime < 500) return
            // Consume the drag-out flag up front so it never leaks into the next event.
            const startedInside = pointerStartedInside
            pointerStartedInside = false
            if (excludeScrollbar && onScrollbar(e)) return
            const path = e.composedPath()
            if (isOutside(path)) {
                // Suppress the outside-fire when the gesture began inside (text-selection
                // drag-out): press inside, release outside should not dismiss.
                if (!startedInside) handlerRef.current(e)
            } else if (onClickInsideRef.current && hitsInside(path)) {
                onClickInsideRef.current(e)
            }
        }

        // { passive: true } — tells the browser this listener won't call
        // preventDefault(), so it can start scrolling immediately without
        // waiting for JS. Critical for smooth mobile scroll performance.
        for (const root of roots) {
            root.addEventListener('touchstart', touchListener as EventListener, { passive: true })
            root.addEventListener(event, mouseListener as EventListener)
            // Only the 'click' event is synthesized after a separate press, so the
            // drag-out guard is only needed there. mousedown/pointerdown already fire
            // at press time, where the inside check alone is correct.
            if (event === 'click') {
                root.addEventListener('pointerdown', downListener as EventListener, true)
            }
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('touchstart', touchListener as EventListener)
                root.removeEventListener(event, mouseListener as EventListener)
                root.removeEventListener('pointerdown', downListener as EventListener, true)
            }
        }
    }, [event, enabled, excludeScrollbar, layered, rootNodes])

    useEffect(() => {
        if (!enabled || !onEscape) return

        const roots = rootNodes ?? [document]

        function keyListener(e: KeyboardEvent): void {
            if (e.key !== 'Escape') return
            // Only the topmost layer closes on Escape (no-op unless `layered`).
            if (layered && layerStack[layerStack.length - 1] !== layerIdRef.current) return
            onEscapeRef.current?.(e)
        }

        for (const root of roots) {
            root.addEventListener('keydown', keyListener as EventListener)
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('keydown', keyListener as EventListener)
            }
        }
    }, [enabled, onEscape, layered, rootNodes])

    useEffect(() => {
        if (!enabled || !onFocusOutside) return

        const roots = rootNodes ?? [document]

        function focusListener(e: FocusEvent): void {
            if (layered && layerStack[layerStack.length - 1] !== layerIdRef.current) return
            const els = refsRef.current.map((r) => r.current).filter((el): el is T => el !== null)
            if (els.length === 0) return
            const path = e.composedPath()
            if (els.some((el) => path.includes(el))) return
            if (
                ignoreRef.current?.some((r) => {
                    const ignoreEl = r.current
                    return ignoreEl !== null && path.includes(ignoreEl)
                })
            )
                return
            onFocusOutsideRef.current?.(e)
        }

        // 'focusin' bubbles (unlike 'focus'), so a single listener on the root
        // catches focus landing on any descendant — including a tab-out to a
        // sibling subtree elsewhere in the document.
        for (const root of roots) {
            root.addEventListener('focusin', focusListener as EventListener)
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('focusin', focusListener as EventListener)
            }
        }
    }, [enabled, onFocusOutside, layered, rootNodes])

    useEffect(() => {
        if (!enabled || !detectIframe) return

        function blurListener(e: FocusEvent): void {
            // Defer one tick: right when window 'blur' fires, document.activeElement
            // may still be <body>; it settles to the focused iframe on the next tick.
            setTimeout(() => {
                const active = document.activeElement
                if (!active || active.tagName !== 'IFRAME') return
                if (layered && layerStack[layerStack.length - 1] !== layerIdRef.current) return
                if (refsRef.current.some((r) => r.current?.contains(active))) return
                if (ignoreRef.current?.some((r) => r.current?.contains(active))) return
                handlerRef.current(e)
            })
        }

        window.addEventListener('blur', blurListener)
        return () => window.removeEventListener('blur', blurListener)
    }, [enabled, detectIframe, layered])
}
