import { useEffect, useRef, type RefObject } from 'react'

export interface UseClickOutsideOptions {
    /**
     * Which event to listen to. Defaults to 'mousedown' so the handler fires
     * before the click event — prevents race conditions with toggle buttons.
     */
    event?: 'mousedown' | 'click' | 'pointerdown'
    /** When false the listener is not attached. Useful for conditional activation. */
    enabled?: boolean
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
    ref: RefObject<T | null>,
    handler: (event: MouseEvent | PointerEvent | TouchEvent) => void,
    options: UseClickOutsideOptions = {}
): void {
    const { event = 'mousedown', enabled = true, ignore, onEscape, rootNodes } = options

    // Keep handler, ignore and onEscape in refs so the effects don't re-run when they change.
    // ignore is an array — it gets recreated on every render, so a ref is the right approach.
    const handlerRef = useRef(handler)
    const ignoreRef = useRef(ignore)
    const onEscapeRef = useRef(onEscape)
    useEffect(() => {
        handlerRef.current = handler
        ignoreRef.current = ignore
        onEscapeRef.current = onEscape
    })

    useEffect(() => {
        if (!enabled) return

        const roots = rootNodes ?? [document]

        // Timestamp of the last touchstart. Used to suppress the synthesized mousedown
        // that mobile browsers fire ~300ms after a touch — without this the handler
        // would fire twice on every tap.
        let lastTouchTime = 0

        function isOutside(path: EventTarget[]): boolean {
            const el = ref.current
            if (!el) return false
            if (path.includes(el)) return false
            if (
                ignoreRef.current?.some((r) => {
                    const ignoreEl = r.current
                    return ignoreEl !== null && path.includes(ignoreEl)
                })
            )
                return false
            return true
        }

        function touchListener(e: TouchEvent): void {
            lastTouchTime = Date.now()
            if (isOutside(e.composedPath())) handlerRef.current(e)
        }

        function mouseListener(e: MouseEvent | PointerEvent): void {
            // Skip synthesized mouse event that follows a real touch within 500 ms.
            if (Date.now() - lastTouchTime < 500) return
            if (isOutside(e.composedPath())) handlerRef.current(e)
        }

        // { passive: true } — tells the browser this listener won't call
        // preventDefault(), so it can start scrolling immediately without
        // waiting for JS. Critical for smooth mobile scroll performance.
        for (const root of roots) {
            root.addEventListener('touchstart', touchListener as EventListener, { passive: true })
            root.addEventListener(event, mouseListener as EventListener)
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('touchstart', touchListener as EventListener)
                root.removeEventListener(event, mouseListener as EventListener)
            }
        }
    }, [ref, event, enabled, rootNodes])

    useEffect(() => {
        if (!enabled || !onEscape) return

        const roots = rootNodes ?? [document]

        function keyListener(e: KeyboardEvent): void {
            if (e.key === 'Escape') onEscapeRef.current?.(e)
        }

        for (const root of roots) {
            root.addEventListener('keydown', keyListener as EventListener)
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('keydown', keyListener as EventListener)
            }
        }
    }, [enabled, onEscape, rootNodes])
}
