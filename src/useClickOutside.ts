import { useCallback } from 'react'

import {
    collectElements,
    normalizeRefs,
    pathHits,
    type NodePredicate,
    type PathPredicate,
} from './internal/dom'
import { useLayer } from './internal/layerStack'
import { useFocusDismiss } from './internal/useFocusDismiss'
import { useIframeDismiss } from './internal/useIframeDismiss'
import { useKeyDismiss } from './internal/useKeyDismiss'
import { useLatestRef } from './internal/useLatestRef'
import { usePointerDismiss } from './internal/usePointerDismiss'
import type { ClickOutsideHandler, ClickOutsideRef, UseClickOutsideOptions } from './types'

/**
 * Detects interactions outside one or more elements and invokes a handler.
 * Orchestrates a set of focused listeners (pointer/touch, Escape, focus-out,
 * iframe blur), all sharing the same "is this outside?" classification and a
 * shared layer stack so only the topmost overlay dismisses at a time.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: ClickOutsideRef<T>,
    handler: ClickOutsideHandler,
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

    // Mirror props into refs so listeners read the latest values without re-attaching.
    const refsRef = useLatestRef(normalizeRefs(ref))
    const ignoreRef = useLatestRef(ignore)
    const handlerRef = useLatestRef(handler)
    const onEscapeRef = useLatestRef(onEscape)
    const onFocusOutsideRef = useLatestRef(onFocusOutside)
    const onClickInsideRef = useLatestRef(onClickInside)

    const isTopLayer = useLayer(enabled, layered)

    // Shared classification, derived once and handed to every listener.
    const isOutside = useCallback<PathPredicate>(
        (path) => {
            if (!isTopLayer()) return false
            const els = collectElements(refsRef.current)
            // Nothing mounted yet — treat as "not outside" so handlers stay quiet.
            if (els.length === 0) return false
            if (pathHits(path, els)) return false
            if (pathHits(path, collectElements(ignoreRef.current))) return false
            return true
        },
        [isTopLayer, refsRef, ignoreRef]
    )

    const isInsideHit = useCallback<PathPredicate>(
        (path) => pathHits(path, collectElements(refsRef.current)),
        [refsRef]
    )

    const isNodeOutside = useCallback<NodePredicate>(
        (node) => {
            if (!isTopLayer()) return false
            if (refsRef.current.some((r) => r.current?.contains(node))) return false
            if (ignoreRef.current?.some((r) => r.current?.contains(node))) return false
            return true
        },
        [isTopLayer, refsRef, ignoreRef]
    )

    usePointerDismiss({
        enabled,
        event,
        excludeScrollbar,
        rootNodes,
        isOutside,
        isInsideHit,
        onOutside: handlerRef,
        onInside: onClickInsideRef,
    })

    useKeyDismiss({
        active: enabled && onEscape !== undefined,
        rootNodes,
        isTopLayer,
        onEscape: onEscapeRef,
    })

    useFocusDismiss({
        active: enabled && onFocusOutside !== undefined,
        rootNodes,
        isOutside,
        onFocusOutside: onFocusOutsideRef,
    })

    useIframeDismiss({
        enabled,
        detectIframe,
        isNodeOutside,
        onOutside: handlerRef,
    })
}
