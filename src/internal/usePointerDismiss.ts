import { useEffect, type RefObject } from 'react'

import type {
    ClickOutsideEvent,
    ClickOutsideHandler,
    ClickOutsideTrigger,
    ListenerRoot,
} from '../types'

import { isScrollbarClick, resolveRoots, type PathPredicate } from './dom'

interface PointerDismissParams {
    enabled: boolean
    event: ClickOutsideTrigger
    excludeScrollbar: boolean
    rootNodes: ListenerRoot[] | undefined
    isOutside: PathPredicate
    isInsideHit: PathPredicate
    onOutside: RefObject<ClickOutsideHandler>
    onInside: RefObject<((event: ClickOutsideEvent) => void) | undefined>
}

/**
 * Mouse/pointer/touch detection. Fires `onOutside` for outside interactions and
 * `onInside` for hits on a watched element. Handles two browser quirks:
 *
 *  - Mobile fires a synthesized mousedown ~300ms after touch; the touch timestamp
 *    suppresses that duplicate within 500ms.
 *  - For `event:'click'`, a press that starts inside and releases outside (text
 *    selection drag-out) must not count as an outside click; a capture-phase
 *    pointerdown records where the gesture began.
 */
export function usePointerDismiss(params: PointerDismissParams): void {
    const {
        enabled,
        event,
        excludeScrollbar,
        rootNodes,
        isOutside,
        isInsideHit,
        onOutside,
        onInside,
    } = params

    useEffect(() => {
        if (!enabled) return

        const roots = resolveRoots(rootNodes)
        let lastTouchTime = 0
        let pointerStartedInside = false

        function dispatch(e: ClickOutsideEvent, path: EventTarget[], startedInside: boolean): void {
            if (isOutside(path)) {
                if (!startedInside) onOutside.current(e)
            } else if (onInside.current && isInsideHit(path)) {
                onInside.current(e)
            }
        }

        function downListener(e: PointerEvent): void {
            pointerStartedInside = !isOutside(e.composedPath())
        }

        function touchListener(e: TouchEvent): void {
            lastTouchTime = Date.now()
            dispatch(e, e.composedPath(), false)
        }

        function pointerListener(e: MouseEvent | PointerEvent): void {
            // Skip the synthesized mouse event that follows a real touch within 500ms.
            if (Date.now() - lastTouchTime < 500) return
            // Consume the drag-out flag up front so it never leaks into the next event.
            const startedInside = pointerStartedInside
            pointerStartedInside = false
            if (excludeScrollbar && isScrollbarClick(e)) return
            dispatch(e, e.composedPath(), startedInside)
        }

        // { passive: true } lets the browser scroll without waiting on this listener.
        for (const root of roots) {
            root.addEventListener('touchstart', touchListener as EventListener, { passive: true })
            root.addEventListener(event, pointerListener as EventListener)
            // Only 'click' is synthesized after a separate press, so the drag-out guard
            // is only needed there; mousedown/pointerdown fire at press time already.
            if (event === 'click') {
                root.addEventListener('pointerdown', downListener as EventListener, true)
            }
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('touchstart', touchListener as EventListener)
                root.removeEventListener(event, pointerListener as EventListener)
                root.removeEventListener('pointerdown', downListener as EventListener, true)
            }
        }
    }, [enabled, event, excludeScrollbar, rootNodes, isOutside, isInsideHit, onOutside, onInside])
}
