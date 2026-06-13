import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useClickOutside } from '../useClickOutside'

import {
    Layers,
    mockClientArea,
    moveFocusToIframe,
    renderClickOutside,
    trackAddedListeners,
    trackRemovedListeners,
} from './helpers'

describe('useClickOutside', () => {
    describe('basic outside detection', () => {
        it('calls handler on mousedown outside', () => {
            const { handler, outside } = renderClickOutside()
            fireEvent.mouseDown(outside)
            expect(handler).toHaveBeenCalledTimes(1)
        })

        it('does not call handler on mousedown inside', () => {
            const { handler, inside } = renderClickOutside()
            fireEvent.mouseDown(inside)
            expect(handler).not.toHaveBeenCalled()
        })
    })

    describe('enabled', () => {
        it('does not call handler when enabled is false', () => {
            const { handler, outside } = renderClickOutside({ enabled: false })
            fireEvent.mouseDown(outside)
            expect(handler).not.toHaveBeenCalled()
        })

        it('starts reacting after enabled is turned on', () => {
            const { handler, outside, rerenderWith } = renderClickOutside({ enabled: false })
            fireEvent.mouseDown(outside)
            expect(handler).not.toHaveBeenCalled()

            rerenderWith({ enabled: true })
            fireEvent.mouseDown(outside)
            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe('event option', () => {
        it('listens to click instead of mousedown when event="click"', () => {
            const { handler, outside } = renderClickOutside({ event: 'click' })
            fireEvent.mouseDown(outside)
            expect(handler).not.toHaveBeenCalled()
            fireEvent.click(outside)
            expect(handler).toHaveBeenCalledTimes(1)
        })

        it('listens to contextmenu when event="contextmenu"', () => {
            const { handler, outside } = renderClickOutside({ event: 'contextmenu' })
            fireEvent.mouseDown(outside)
            expect(handler).not.toHaveBeenCalled()
            fireEvent.contextMenu(outside)
            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe('onEscape', () => {
        it('calls onEscape when Escape is pressed', () => {
            const onEscape = vi.fn()
            const { handler } = renderClickOutside({ onEscape })
            fireEvent.keyDown(document, { key: 'Escape' })
            expect(onEscape).toHaveBeenCalledTimes(1)
            expect(handler).not.toHaveBeenCalled()
        })

        it('ignores other keys', () => {
            const onEscape = vi.fn()
            renderClickOutside({ onEscape })
            fireEvent.keyDown(document, { key: 'Enter' })
            fireEvent.keyDown(document, { key: 'Tab' })
            expect(onEscape).not.toHaveBeenCalled()
        })

        it('does not attach a keydown listener when onEscape is omitted', () => {
            const listeners = trackAddedListeners()
            renderClickOutside()
            expect(listeners.has('keydown')).toBe(false)
            listeners.restore()
        })
    })

    describe('onClickInside', () => {
        it('fires on a click inside', () => {
            const onClickInside = vi.fn()
            const { handler, inside } = renderClickOutside({ onClickInside })
            fireEvent.mouseDown(inside)
            expect(onClickInside).toHaveBeenCalledTimes(1)
            expect(handler).not.toHaveBeenCalled()
        })

        it('does not fire on a click outside', () => {
            const onClickInside = vi.fn()
            const { handler, outside } = renderClickOutside({ onClickInside })
            fireEvent.mouseDown(outside)
            expect(onClickInside).not.toHaveBeenCalled()
            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe('onFocusOutside', () => {
        it('fires when focus moves outside', () => {
            const onFocusOutside = vi.fn()
            const { outside } = renderClickOutside({ onFocusOutside })
            fireEvent.focusIn(outside)
            expect(onFocusOutside).toHaveBeenCalledTimes(1)
        })

        it('does not fire when focus stays inside', () => {
            const onFocusOutside = vi.fn()
            const { inside } = renderClickOutside({ onFocusOutside })
            fireEvent.focusIn(inside)
            expect(onFocusOutside).not.toHaveBeenCalled()
        })

        it('does not attach a focusin listener when onFocusOutside is omitted', () => {
            const listeners = trackAddedListeners()
            renderClickOutside()
            expect(listeners.has('focusin')).toBe(false)
            listeners.restore()
        })
    })

    describe('ignore', () => {
        it('treats a click on an ignored element as inside', () => {
            const handler = vi.fn()
            function WithIgnore(): React.JSX.Element {
                const ref = useRef<HTMLDivElement>(null)
                const triggerRef = useRef<HTMLButtonElement>(null)
                useClickOutside(ref, handler, { event: 'click', ignore: [triggerRef] })
                return (
                    <div>
                        <div ref={ref} data-testid="inside">
                            inside
                        </div>
                        <button ref={triggerRef} data-testid="trigger">
                            trigger
                        </button>
                        <div data-testid="outside">outside</div>
                    </div>
                )
            }
            const { getByTestId } = render(<WithIgnore />)
            fireEvent.click(getByTestId('trigger'))
            expect(handler).not.toHaveBeenCalled()
            fireEvent.click(getByTestId('outside'))
            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe('text-selection drag guard (event="click")', () => {
        it('does not dismiss when the gesture starts inside and ends outside', () => {
            const { handler, inside, outside } = renderClickOutside({ event: 'click' })
            // Press inside (start selecting text), drag out, release outside.
            fireEvent.pointerDown(inside)
            fireEvent.click(outside)
            expect(handler).not.toHaveBeenCalled()
        })

        it('dismisses on a normal outside click (down and up outside)', () => {
            const { handler, outside } = renderClickOutside({ event: 'click' })
            fireEvent.pointerDown(outside)
            fireEvent.click(outside)
            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe('multiple refs', () => {
        it('treats any of the passed refs as inside', () => {
            const handler = vi.fn()
            function MultiRef(): React.JSX.Element {
                const a = useRef<HTMLDivElement>(null)
                const b = useRef<HTMLDivElement>(null)
                useClickOutside([a, b], handler)
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
            const { getByTestId } = render(<MultiRef />)
            fireEvent.mouseDown(getByTestId('a'))
            fireEvent.mouseDown(getByTestId('b'))
            expect(handler).not.toHaveBeenCalled()
            fireEvent.mouseDown(getByTestId('outside'))
            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe('layered', () => {
        it('only the top layer reacts to an outside click', () => {
            const onA = vi.fn()
            const onB = vi.fn()
            const { getByTestId } = render(<Layers onA={onA} onB={onB} />)
            fireEvent.mouseDown(getByTestId('outside'))
            expect(onB).toHaveBeenCalledTimes(1)
            expect(onA).not.toHaveBeenCalled()
        })

        it('only the top layer reacts to Escape', () => {
            const escA = vi.fn()
            const escB = vi.fn()
            render(<Layers onA={vi.fn()} onB={vi.fn()} escA={escA} escB={escB} />)
            fireEvent.keyDown(document, { key: 'Escape' })
            expect(escB).toHaveBeenCalledTimes(1)
            expect(escA).not.toHaveBeenCalled()
        })
    })

    describe('touch / mobile', () => {
        it('calls handler on touchstart outside', () => {
            const { handler, outside } = renderClickOutside()
            fireEvent.touchStart(outside)
            expect(handler).toHaveBeenCalledTimes(1)
        })

        it('does not call handler on touchstart inside', () => {
            const { handler, inside } = renderClickOutside()
            fireEvent.touchStart(inside)
            expect(handler).not.toHaveBeenCalled()
        })

        it('does not double-fire when a touch is followed by a synthesized mousedown', () => {
            const { handler, outside } = renderClickOutside()
            fireEvent.touchStart(outside)
            fireEvent.mouseDown(outside)
            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe('excludeScrollbar', () => {
        it('ignores a click on the native scrollbar but not within the client area', () => {
            const restore = mockClientArea(800, 600)
            const { handler, outside } = renderClickOutside({ excludeScrollbar: true })

            // x=810 is past the client area → on the vertical scrollbar.
            fireEvent.mouseDown(outside, { clientX: 810, clientY: 100 })
            expect(handler).not.toHaveBeenCalled()

            fireEvent.mouseDown(outside, { clientX: 100, clientY: 100 })
            expect(handler).toHaveBeenCalledTimes(1)

            restore()
        })
    })

    describe('detectIframe', () => {
        it('calls handler when focus moves into an iframe', async () => {
            const { handler } = renderClickOutside({ detectIframe: true })
            const cleanup = await moveFocusToIframe()
            expect(handler).toHaveBeenCalledTimes(1)
            cleanup()
        })

        it('does not call handler on window blur when detectIframe is off', async () => {
            const { handler } = renderClickOutside()
            const cleanup = await moveFocusToIframe()
            expect(handler).not.toHaveBeenCalled()
            cleanup()
        })
    })

    describe('cleanup on unmount', () => {
        it('removes its listeners', () => {
            const listeners = trackRemovedListeners()
            const { unmount } = renderClickOutside()
            unmount()
            expect(listeners.has('mousedown')).toBe(true)
            expect(listeners.has('touchstart')).toBe(true)
            listeners.restore()
        })

        it('stops calling handler', () => {
            const { handler, unmount } = renderClickOutside()
            unmount()
            fireEvent.mouseDown(document.body)
            expect(handler).not.toHaveBeenCalled()
        })
    })
})
