import { useCallback, useEffect, useRef } from 'react'

// Active "layered" instances, ordered by mount time so the last-opened overlay
// sits on top. Only the topmost instance reacts to an outside click / Escape, so
// a single interaction dismisses just the frontmost dropdown/modal instead of
// every open one at once. Module-level on purpose: the stack is shared across all
// hook instances in the app.
const stack: symbol[] = []

/**
 * Registers this instance in the shared layer stack while `active`, and returns a
 * stable predicate reporting whether it is currently the topmost layer.
 *
 * When `participate` is false the instance opts out of layering entirely and the
 * predicate always returns `true` (i.e. it always reacts).
 */
export function useLayer(active: boolean, participate: boolean): () => boolean {
    const idRef = useRef<symbol | null>(null)
    if (idRef.current === null) idRef.current = Symbol('clickOutsideLayer')

    useEffect(() => {
        if (!active || !participate) return
        const id = idRef.current!
        stack.push(id)
        return () => {
            const index = stack.indexOf(id)
            if (index !== -1) stack.splice(index, 1)
        }
    }, [active, participate])

    return useCallback(
        () => !participate || stack[stack.length - 1] === idRef.current,
        [participate]
    )
}
