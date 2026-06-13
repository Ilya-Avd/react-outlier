import { useEffect, type RefObject } from 'react'

import type { ClickOutsideHandler } from '../types'

import { type NodePredicate } from './dom'

interface IframeDismissParams {
    enabled: boolean
    detectIframe: boolean
    isNodeOutside: NodePredicate
    onOutside: RefObject<ClickOutsideHandler>
}

/**
 * Treats focus moving into a same-page `<iframe>` as an outside interaction.
 * Clicking inside an iframe dispatches no mouse event in the parent document, so
 * the pointer listeners never see it; a window `blur` whose resulting
 * `document.activeElement` is an outside iframe stands in for that click.
 */
export function useIframeDismiss(params: IframeDismissParams): void {
    const { enabled, detectIframe, isNodeOutside, onOutside } = params

    useEffect(() => {
        if (!enabled || !detectIframe) return

        function blurListener(e: FocusEvent): void {
            // Defer one tick: at blur time document.activeElement may still be <body>;
            // it settles to the focused iframe on the next tick.
            setTimeout(() => {
                const active = document.activeElement
                if (active?.tagName === 'IFRAME' && isNodeOutside(active)) onOutside.current(e)
            })
        }

        window.addEventListener('blur', blurListener)
        return () => window.removeEventListener('blur', blurListener)
    }, [enabled, detectIframe, isNodeOutside, onOutside])
}
