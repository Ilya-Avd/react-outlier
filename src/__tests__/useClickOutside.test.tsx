import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useClickOutside, type UseClickOutsideOptions } from '../useClickOutside'

// ─── Test component ───────────────────────────────────────────────────────────

function Setup({
    handler,
    options = {},
}: {
    handler: (e: MouseEvent | PointerEvent | TouchEvent) => void
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

    it('слушает click вместо mousedown при event="click"', () => {
        const { getByTestId } = render(<Setup handler={handler} options={{ event: 'click' }} />)
        fireEvent.mouseDown(getByTestId('outside'))
        expect(handler).not.toHaveBeenCalled()
        fireEvent.click(getByTestId('outside'))
        expect(handler).toHaveBeenCalledTimes(1)
    })
})
