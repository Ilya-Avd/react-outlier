import { type RefObject } from 'react'

import type { ClickOutsideRef, ListenerRoot } from '../types'

/** Predicate over an event's composed path (e.g. "is this click outside?"). */
export type PathPredicate = (path: EventTarget[]) => boolean

/** Predicate over a single DOM node (e.g. "is the focused iframe outside?"). */
export type NodePredicate = (node: Node) => boolean

/** Normalize the `ref` argument (single ref or array) into a flat array. */
export function normalizeRefs<T extends HTMLElement>(
    ref: ClickOutsideRef<T>
): RefObject<T | null>[] {
    return Array.isArray(ref) ? ref : [ref]
}

/** The roots to attach listeners to, defaulting to the main document. */
export function resolveRoots(rootNodes: ListenerRoot[] | undefined): ListenerRoot[] {
    return rootNodes ?? [document]
}

/** Currently-mounted elements behind a list of refs (nulls filtered out). */
export function collectElements<T extends Element>(
    refs: readonly RefObject<T | null>[] | undefined
): T[] {
    if (!refs) return []
    return refs.map((r) => r.current).filter((el): el is T => el !== null)
}

/** Whether the event path passes through any of the given elements. */
export function pathHits(path: EventTarget[], elements: readonly Element[]): boolean {
    return elements.some((el) => path.includes(el))
}

/**
 * Whether a mouse/pointer event landed on the browser's native scrollbar.
 * The client area excludes the scrollbar, so coordinates beyond it hit the bar.
 */
export function isScrollbarClick(e: MouseEvent | PointerEvent): boolean {
    const root = document.documentElement
    return e.clientX > root.clientWidth || e.clientY > root.clientHeight
}
