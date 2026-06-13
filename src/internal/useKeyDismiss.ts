import { useEffect, type RefObject } from 'react'

import type { ListenerRoot } from '../types'

import { resolveRoots } from './dom'

interface KeyDismissParams {
    active: boolean
    rootNodes: ListenerRoot[] | undefined
    isTopLayer: () => boolean
    onEscape: RefObject<((event: KeyboardEvent) => void) | undefined>
}

/** Calls `onEscape` when Escape is pressed, respecting layer ordering. */
export function useKeyDismiss(params: KeyDismissParams): void {
    const { active, rootNodes, isTopLayer, onEscape } = params

    useEffect(() => {
        if (!active) return

        const roots = resolveRoots(rootNodes)

        function keyListener(e: KeyboardEvent): void {
            if (e.key !== 'Escape' || !isTopLayer()) return
            onEscape.current?.(e)
        }

        for (const root of roots) {
            root.addEventListener('keydown', keyListener as EventListener)
        }

        return () => {
            for (const root of roots) {
                root.removeEventListener('keydown', keyListener as EventListener)
            }
        }
    }, [active, rootNodes, isTopLayer, onEscape])
}
