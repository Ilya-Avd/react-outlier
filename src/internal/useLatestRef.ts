import { useEffect, useRef, type RefObject } from 'react'

/**
 * Mirrors `value` into a ref that is refreshed after every commit.
 *
 * Lets long-lived event listeners read the latest props/callbacks at call time
 * without being torn down and re-attached whenever those values change between
 * renders — values recreated on each render (callbacks, arrays) would otherwise
 * thrash the listener effects.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
    const ref = useRef(value)
    useEffect(() => {
        ref.current = value
    })
    return ref
}
