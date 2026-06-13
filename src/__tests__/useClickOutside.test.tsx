import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UseClickOutsideOptions } from '../types'
import { useClickOutside } from '../useClickOutside'

// ─── Test component ───────────────────────────────────────────────────────────

function Setup({
    handler,
    options = {},
}: {
    handler: (e: MouseEvent | PointerEvent | TouchEvent | FocusEvent) => void
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useClickOutside', () => {
    let handler: ReturnType<typeof vi.fn>

    beforeEach(() => {
        handler = vi.fn()
    })

    // ── Basic ────────────────────────────────────────────────────────────────

    it('вызывает handler при mousedown снаружи', () => {
        const { getByTestId } = render(<Setup handler={handler} />)
        fireEvent.mouseDown(getByTestId('outside'))
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('не вызывает handler при mousedown внутри', () => {
        const { getByTestId } = render(<Setup handler={handler} />)
        fireEvent.mouseDown(getByTestId('inside'))
        expect(handler).not.toHaveBeenCalled()
    })

    // ── enabled ──────────────────────────────────────────────────────────────

    it('не вызывает handler когда enabled=false', () => {
        const { getByTestId } = render(<Setup handler={handler} options={{ enabled: false }} />)
        fireEvent.mouseDown(getByTestId('outside'))
        expect(handler).not.toHaveBeenCalled()
    })

    it('начинает реагировать после включения enabled', () => {
        const { getByTestId, rerender } = render(
            <Setup handler={handler} options={{ enabled: false }} />
        )
        fireEvent.mouseDown(getByTestId('outside'))
        expect(handler).not.toHaveBeenCalled()

        rerender(<Setup handler={handler} options={{ enabled: true }} />)
        fireEvent.mouseDown(getByTestId('outside'))
        expect(handler).toHaveBeenCalledTimes(1)
    })

    // ── Escape ───────────────────────────────────────────────────────────────

    it('вызывает onEscape при нажатии Escape', () => {
        const onEscape = vi.fn()
        render(<Setup handler={handler} options={{ onEscape }} />)
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(onEscape).toHaveBeenCalledTimes(1)
        expect(handler).not.toHaveBeenCalled()
    })

    it('не вызывает onEscape для других клавиш', () => {
        const onEscape = vi.fn()
        render(<Setup handler={handler} options={{ onEscape }} />)
        fireEvent.keyDown(document, { key: 'Enter' })
        fireEvent.keyDown(document, { key: 'Tab' })
        expect(onEscape).not.toHaveBeenCalled()
    })

    it('не вешает keydown listener если onEscape не передан', () => {
        const addSpy = vi.spyOn(document, 'addEventListener')
        render(<Setup handler={handler} />)
        const keydownCalls = addSpy.mock.calls.filter(([type]) => type === 'keydown')
        expect(keydownCalls).toHaveLength(0)
        addSpy.mockRestore()
    })

    // ── onClickInside ────────────────────────────────────────────────────────────

    it('вызывает onClickInside при клике внутри', () => {
        const onClickInside = vi.fn()
        const { getByTestId } = render(<Setup handler={handler} options={{ onClickInside }} />)
        fireEvent.mouseDown(getByTestId('inside'))
        expect(onClickInside).toHaveBeenCalledTimes(1)
        expect(handler).not.toHaveBeenCalled()
    })

    it('не вызывает onClickInside при клике снаружи', () => {
        const onClickInside = vi.fn()
        const { getByTestId } = render(<Setup handler={handler} options={{ onClickInside }} />)
        fireEvent.mouseDown(getByTestId('outside'))
        expect(onClickInside).not.toHaveBeenCalled()
        expect(handler).toHaveBeenCalledTimes(1)
    })

    // ── onFocusOutside ─────────────────────────────────────────────────────────

    it('вызывает onFocusOutside когда фокус уходит наружу', () => {
        const onFocusOutside = vi.fn()
        const { getByTestId } = render(<Setup handler={handler} options={{ onFocusOutside }} />)
        fireEvent.focusIn(getByTestId('outside'))
        expect(onFocusOutside).toHaveBeenCalledTimes(1)
    })

    it('не вызывает onFocusOutside когда фокус внутри', () => {
        const onFocusOutside = vi.fn()
        const { getByTestId } = render(<Setup handler={handler} options={{ onFocusOutside }} />)
        fireEvent.focusIn(getByTestId('inside'))
        expect(onFocusOutside).not.toHaveBeenCalled()
    })

    it('не вешает focusin listener если onFocusOutside не передан', () => {
        const addSpy = vi.spyOn(document, 'addEventListener')
        render(<Setup handler={handler} />)
        const focusinCalls = addSpy.mock.calls.filter(([type]) => type === 'focusin')
        expect(focusinCalls).toHaveLength(0)
        addSpy.mockRestore()
    })

    // ── ignore ───────────────────────────────────────────────────────────────

    it('игнорирует клик на элемент из ignore', () => {
        function WithIgnore(): React.JSX.Element {
            const ref = useRef<HTMLDivElement>(null)
            const ignoreRef = useRef<HTMLButtonElement>(null)
            useClickOutside(ref, handler, { event: 'click', ignore: [ignoreRef] })
            return (
                <div>
                    <div ref={ref} data-testid="inside">
                        inside
                    </div>
                    <button ref={ignoreRef} data-testid="trigger">
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

    // ── pointer-down-inside guard (text-selection drag) ───────────────────────

    it('не закрывает при выделении текста: pointerdown внутри → click снаружи', () => {
        const { getByTestId } = render(<Setup handler={handler} options={{ event: 'click' }} />)
        // User presses inside (starts selecting text), drags out and releases outside.
        fireEvent.pointerDown(getByTestId('inside'))
        fireEvent.click(getByTestId('outside'))
        expect(handler).not.toHaveBeenCalled()
    })

    it('закрывает при обычном клике снаружи: pointerdown снаружи → click снаружи', () => {
        const { getByTestId } = render(<Setup handler={handler} options={{ event: 'click' }} />)
        fireEvent.pointerDown(getByTestId('outside'))
        fireEvent.click(getByTestId('outside'))
        expect(handler).toHaveBeenCalledTimes(1)
    })

    // ── multiple refs ───────────────────────────────────────────────────────────

    it('считает "внутри" любой из переданных рефов (массив)', () => {
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

    // ── layered ─────────────────────────────────────────────────────────────────

    function Layers({
        onA,
        onB,
        escA,
        escB,
    }: {
        onA: () => void
        onB: () => void
        escA?: () => void
        escB?: () => void
    }): React.JSX.Element {
        const a = useRef<HTMLDivElement>(null)
        const b = useRef<HTMLDivElement>(null)
        useClickOutside(a, onA, { layered: true, onEscape: escA })
        useClickOutside(b, onB, { layered: true, onEscape: escB }) // mounted last → on top
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

    it('layered: на клик снаружи реагирует только верхний слой', () => {
        const onA = vi.fn()
        const onB = vi.fn()
        const { getByTestId } = render(<Layers onA={onA} onB={onB} />)
        fireEvent.mouseDown(getByTestId('outside'))
        expect(onB).toHaveBeenCalledTimes(1)
        expect(onA).not.toHaveBeenCalled()
    })

    it('layered: на Escape реагирует только верхний слой', () => {
        const escA = vi.fn()
        const escB = vi.fn()
        render(<Layers onA={vi.fn()} onB={vi.fn()} escA={escA} escB={escB} />)
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(escB).toHaveBeenCalledTimes(1)
        expect(escA).not.toHaveBeenCalled()
    })

    // ── Touch ────────────────────────────────────────────────────────────────

    it('вызывает handler при touchstart снаружи', () => {
        const { getByTestId } = render(<Setup handler={handler} />)
        fireEvent.touchStart(getByTestId('outside'))
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('не вызывает handler при touchstart внутри', () => {
        const { getByTestId } = render(<Setup handler={handler} />)
        fireEvent.touchStart(getByTestId('inside'))
        expect(handler).not.toHaveBeenCalled()
    })

    it('не дублирует вызов при touchstart + mousedown (мобильный браузер)', () => {
        const { getByTestId } = render(<Setup handler={handler} />)
        const outside = getByTestId('outside')
        // Mobile sequence: touchstart fires first, then synthesized mousedown
        fireEvent.touchStart(outside)
        fireEvent.mouseDown(outside)
        // Handler must fire exactly once — mousedown is suppressed within 500ms
        expect(handler).toHaveBeenCalledTimes(1)
    })

    // ── excludeScrollbar ────────────────────────────────────────────────────────

    it('игнорирует клик по скроллбару при excludeScrollbar', () => {
        // jsdom has no layout, so fake the client area: 800×600.
        Object.defineProperty(document.documentElement, 'clientWidth', {
            value: 800,
            configurable: true,
        })
        Object.defineProperty(document.documentElement, 'clientHeight', {
            value: 600,
            configurable: true,
        })
        const { getByTestId } = render(
            <Setup handler={handler} options={{ excludeScrollbar: true }} />
        )

        // x=810 is past the client area → on the vertical scrollbar.
        fireEvent.mouseDown(getByTestId('outside'), { clientX: 810, clientY: 100 })
        expect(handler).not.toHaveBeenCalled()

        // A click within the client area still fires.
        fireEvent.mouseDown(getByTestId('outside'), { clientX: 100, clientY: 100 })
        expect(handler).toHaveBeenCalledTimes(1)

        delete (document.documentElement as { clientWidth?: number }).clientWidth
        delete (document.documentElement as { clientHeight?: number }).clientHeight
    })

    // ── detectIframe ───────────────────────────────────────────────────────────

    it('вызывает handler при уходе фокуса в iframe (detectIframe)', async () => {
        const iframe = document.createElement('iframe')
        document.body.appendChild(iframe)
        render(<Setup handler={handler} options={{ detectIframe: true }} />)

        iframe.focus()
        fireEvent.blur(window)
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(handler).toHaveBeenCalledTimes(1)
        iframe.remove()
    })

    it('не вызывает handler по window blur без detectIframe', async () => {
        const iframe = document.createElement('iframe')
        document.body.appendChild(iframe)
        render(<Setup handler={handler} />)

        iframe.focus()
        fireEvent.blur(window)
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(handler).not.toHaveBeenCalled()
        iframe.remove()
    })

    // ── Cleanup ───────────────────────────────────────────────────────────────

    it('снимает listeners после размонтирования', () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener')
        const { unmount } = render(<Setup handler={handler} />)
        unmount()
        expect(removeSpy.mock.calls.some(([type]) => type === 'mousedown')).toBe(true)
        expect(removeSpy.mock.calls.some(([type]) => type === 'touchstart')).toBe(true)
        removeSpy.mockRestore()
    })

    it('не вызывает handler после размонтирования', () => {
        const { unmount } = render(<Setup handler={handler} />)
        unmount()
        fireEvent.mouseDown(document.body)
        expect(handler).not.toHaveBeenCalled()
    })

    // ── event option ──────────────────────────────────────────────────────────

    it('слушает contextmenu при event="contextmenu"', () => {
        const { getByTestId } = render(
            <Setup handler={handler} options={{ event: 'contextmenu' }} />
        )
        fireEvent.mouseDown(getByTestId('outside'))
        expect(handler).not.toHaveBeenCalled()
        fireEvent.contextMenu(getByTestId('outside'))
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('слушает click вместо mousedown при event="click"', () => {
        const { getByTestId } = render(<Setup handler={handler} options={{ event: 'click' }} />)
        fireEvent.mouseDown(getByTestId('outside'))
        expect(handler).not.toHaveBeenCalled()
        fireEvent.click(getByTestId('outside'))
        expect(handler).toHaveBeenCalledTimes(1)
    })
})
