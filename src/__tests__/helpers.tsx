import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { vi } from 'vitest'

import type { UseClickOutsideOptions } from '../types'
import { useClickOutside } from '../useClickOutside'

/** Handler signature accepted by useClickOutside (the iframe path passes a FocusEvent). */
export type AnyHandler = (event: MouseEvent | PointerEvent | TouchEvent | FocusEvent) => void

/** What the single-element harness exposes to a test. */
type ClickOutsideHarness = ReturnType<typeof render> & {
    handler: ReturnType<typeof vi.fn>
    inside: HTMLElement
    outside: HTMLElement
    rerenderWith: (next?: UseClickOutsideOptions) => void
}

/** Spy wrapper for querying which event types were (de)registered on document. */
interface ListenerTracker {
    has: (type: string) => boolean
    restore: () => void
}

// A single watched element with sibling "inside" and "outside" targets.
function Single({
    handler,
    options,
}: {
    handler: AnyHandler
    options?: UseClickOutsideOptions
}): React.JSX.Element {
    const ref = useRef<HTMLDivElement>(null)
    useClickOutside(ref, handler, options)
    return (
        <div>
            <div ref={ref} data-testid="inside">
                inside
            </div>
            <div data-testid="outside">outside</div>
        </div>
    )
}

/**
 * Render the single-element harness. Returns the handler spy, the two targets, a
 * `rerenderWith` to change options (keeping the same handler), and the usual view.
 */
export const renderClickOutside = (options?: UseClickOutsideOptions): ClickOutsideHarness => {
    const handler = vi.fn()
    const view = render(<Single handler={handler} options={options} />)
    return {
        handler,
        inside: view.getByTestId('inside'),
        outside: view.getByTestId('outside'),
        rerenderWith: (next?: UseClickOutsideOptions) =>
            view.rerender(<Single handler={handler} options={next} />),
        ...view,
    }
}

/** Two stacked layered instances; B is mounted last, so it sits on top of the stack. */
export function Layers({
    onA,
    onB,
    escA,
    escB,
}: {
    onA: AnyHandler
    onB: AnyHandler
    escA?: () => void
    escB?: () => void
}): React.JSX.Element {
    const a = useRef<HTMLDivElement>(null)
    const b = useRef<HTMLDivElement>(null)
    useClickOutside(a, onA, { layered: true, onEscape: escA })
    useClickOutside(b, onB, { layered: true, onEscape: escB })
    return (
        <div>
            <div ref={a} data-testid="a">
                a
            </div>
            <div ref={b} data-testid="b">
                b
            </div>
            <div data-testid="outside">outside</div>
        </div>
    )
}

/** Spy on document.addEventListener; query which event types were attached. */
export const trackAddedListeners = (): ListenerTracker => {
    const spy = vi.spyOn(document, 'addEventListener')
    return {
        has: (type: string): boolean => spy.mock.calls.some(([t]) => t === type),
        restore: (): void => spy.mockRestore(),
    }
}

/** Spy on document.removeEventListener; query which event types were detached. */
export const trackRemovedListeners = (): ListenerTracker => {
    const spy = vi.spyOn(document, 'removeEventListener')
    return {
        has: (type: string): boolean => spy.mock.calls.some(([t]) => t === type),
        restore: (): void => spy.mockRestore(),
    }
}

/** Fake the document client area (jsdom has no layout). Returns a cleanup function. */
export const mockClientArea = (width: number, height: number): (() => void) => {
    const root = document.documentElement
    Object.defineProperty(root, 'clientWidth', { value: width, configurable: true })
    Object.defineProperty(root, 'clientHeight', { value: height, configurable: true })
    return () => {
        delete (root as { clientWidth?: number }).clientWidth
        delete (root as { clientHeight?: number }).clientHeight
    }
}

/** Resolve after the current macrotask — flushes the setTimeout(0) used by detectIframe. */
export const nextTick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * Append an iframe, move focus into it, fire window blur, and wait one tick so
 * document.activeElement settles. Returns a cleanup function that removes the iframe.
 */
export const moveFocusToIframe = async (): Promise<() => void> => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    iframe.focus()
    fireEvent.blur(window)
    await nextTick()
    return () => iframe.remove()
}
