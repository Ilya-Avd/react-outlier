import { type RefObject } from 'react'

/** Pointer/touch events the main `handler` and `onClickInside` may receive. */
export type ClickOutsideEvent = MouseEvent | PointerEvent | TouchEvent

/** DOM event used to detect an outside interaction. */
export type ClickOutsideTrigger = 'mousedown' | 'click' | 'pointerdown' | 'contextmenu'

/** A node that listeners can be attached to. Shadow roots and iframe documents qualify. */
export type ListenerRoot = Document | ShadowRoot

/**
 * The dismiss handler. Receives a pointer/touch event for outside clicks, or a
 * `FocusEvent` when `detectIframe` catches focus moving into an outside iframe.
 */
export type ClickOutsideHandler = (event: ClickOutsideEvent | FocusEvent) => void

/** A single watched ref, or an array of refs all treated as "inside". */
export type ClickOutsideRef<T extends HTMLElement = HTMLElement> =
    | RefObject<T | null>
    | RefObject<T | null>[]

export interface UseClickOutsideOptions {
    /**
     * Which event to listen to. Defaults to 'mousedown' so the handler fires
     * before the click event — prevents race conditions with toggle buttons.
     * Use 'contextmenu' to dismiss on a right-click outside.
     */
    event?: ClickOutsideTrigger
    /** When false the listener is not attached. Useful for conditional activation. */
    enabled?: boolean
    /**
     * Opt into layered dismissal. When several layered instances are active at once
     * (e.g. a dropdown opened from within a modal), only the most recently mounted
     * one reacts to an outside click or Escape. Without this every open layer would
     * dismiss on a single interaction.
     */
    layered?: boolean
    /**
     * Ignore clicks that land on the browser's native scrollbar. A scrollbar click
     * reports coordinates outside the page's client area, so it would otherwise be
     * treated as an outside click and dismiss the element — a common annoyance when
     * scrolling a long dropdown. Only affects mouse/pointer events.
     */
    excludeScrollbar?: boolean
    /**
     * Also treat focus moving into a same-page <iframe> as an outside interaction.
     * Clicking inside an iframe does NOT dispatch a mouse event in the parent
     * document, so the pointer listeners never see it. When true, a window `blur`
     * whose resulting `document.activeElement` is an outside iframe calls `handler`.
     */
    detectIframe?: boolean
    /**
     * Refs to elements that should be treated as "inside" even if they are
     * outside the watched element in the DOM. Typical uses:
     *   - trigger button that opens the dropdown (when using 'click' event)
     *   - React portal container rendered elsewhere in the DOM tree
     */
    ignore?: RefObject<HTMLElement | null>[]
    /**
     * Called when the Escape key is pressed. Kept separate from the main handler
     * so callers don't have to narrow the event type with instanceof checks.
     */
    onEscape?: (event: KeyboardEvent) => void
    /**
     * Called when focus moves to an element outside the watched element (and not
     * in `ignore`). Covers the keyboard case the pointer listeners miss: tabbing
     * out of a dropdown should dismiss it. Listens to `focusin`, so it fires for
     * both mouse- and keyboard-driven focus changes.
     */
    onFocusOutside?: (event: FocusEvent) => void
    /**
     * Called when the interaction lands inside the watched element — the inverse of
     * `handler`. Uses the same configured `event`/touch listeners, so you don't need
     * a separate onClick on the element.
     */
    onClickInside?: (event: ClickOutsideEvent) => void
    /**
     * Root nodes to attach listeners to. Defaults to [document].
     * Pass additional roots when your component lives inside a Shadow DOM or
     * an iframe — events don't cross those boundaries, so the default document
     * listener would never fire.
     *
     * @example Shadow DOM
     * rootNodes={[document, myShadowRoot]}
     *
     * @example iframe
     * rootNodes={[iframe.contentDocument ?? document]}
     */
    rootNodes?: ListenerRoot[]
}
