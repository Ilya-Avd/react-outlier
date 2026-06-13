import { useEffect, type RefObject } from 'react'

import type { ListenerRoot } from '../types'

import { resolveRoots, type PathPredicate } from './dom'

interface FocusDismissParams {
    active: boolean
    rootNodes: ListenerRoot[] | undefined
    isOutside: PathPredicate
    onFocusOutside: RefObject<((event: FocusEvent) => void) | undefined>
}

/**
 * Calls `onFocusOutside` when focus moves to an outside element — the keyboard
 * (tab-out) path the pointer listeners can't see. Uses `focusin`, which bubbles,
 * so a single root listener catches focus landing anywhere in the tree.
 */
export function useFocusDismiss(params: FocusDismissParams): void {
    const { active, rootNodes, isOutside, onFocusOutside } = params

    useEffect(() => {
        if (!active) return

        const roots = resolveRoots(rootNodes)

        function focusListener(e: FocusEvent): void {
            if (isOutside(e.composedPath())) onFocusOutside.current?.(e)
        }

        for (const root of roots) {
            root.addEventListener('focusin', focusListener as EventListener)
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('focusin', focusListener as EventListener)
            }
        }
    }, [active, rootNodes, isOutside, onFocusOutside])
}
