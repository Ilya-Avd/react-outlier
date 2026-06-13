import { StrictMode, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'

import { useClickOutside } from '../src'

const box: React.CSSProperties = {
    border: '2px solid #6366f1',
    borderRadius: 8,
    padding: 16,
    background: '#f5f3ff',
    display: 'inline-block',
    minWidth: 220,
}

const chip: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
    marginLeft: 8,
}

// ─── 1. Basic ────────────────────────────────────────────────────────────────

function BasicDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useClickOutside(ref, () => setOpen(false))

    return (
        <Section title="1. Basic" hint="Click outside the blue box">
            {open ? (
                <div ref={ref} style={box}>
                    I'm open. Click outside.
                </div>
            ) : (
                <button onClick={() => setOpen(true)}>Open</button>
            )}
        </Section>
    )
}

// ─── 2. Escape key ───────────────────────────────────────────────────────────

function EscapeDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useClickOutside(ref, () => setOpen(false), {
        onEscape: () => setOpen(false),
    })

    return (
        <Section title="2. Escape key" hint="Press Escape or click outside">
            {open ? (
                <div ref={ref} style={box}>
                    Closes on Escape and on an outside click.
                </div>
            ) : (
                <button onClick={() => setOpen(true)}>Open</button>
            )}
        </Section>
    )
}

// ─── 3. ignore option ────────────────────────────────────────────────────────

function IgnoreDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    // Trigger button is ignored — without this, using event='click' would
    // close the menu immediately after opening it.
    useClickOutside(menuRef, () => setOpen(false), {
        event: 'click',
        ignore: [triggerRef],
    })

    return (
        <Section
            title="3. ignore option"
            hint="The trigger button is ignored — the menu toggles correctly"
        >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <button ref={triggerRef} onClick={() => setOpen((v) => !v)}>
                    {open ? 'Close' : 'Open'} menu
                </button>
                {open && (
                    <div ref={menuRef} style={box}>
                        Click the button again — it closes. <br />
                        Click here — it stays open.
                    </div>
                )}
            </div>
        </Section>
    )
}

// ─── 4. Portal ───────────────────────────────────────────────────────────────

function PortalDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const portalRef = useRef<HTMLDivElement>(null)

    // portalRef is passed to ignore so clicks inside the portal don't close the menu.
    useClickOutside(menuRef, () => setOpen(false), {
        ignore: [portalRef],
    })

    return (
        <Section
            title="4. Portal + ignore"
            hint="The tooltip renders into document.body but doesn't close the menu"
        >
            <div ref={menuRef} style={box}>
                <p style={{ margin: '0 0 8px' }}>Menu (in the regular DOM)</p>
                <button onClick={() => setOpen((v) => !v)}>
                    {open ? 'Hide' : 'Show'} portal tooltip
                </button>
            </div>

            {open &&
                createPortal(
                    <div
                        ref={portalRef}
                        style={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            background: '#1e1b4b',
                            color: '#fff',
                            padding: '12px 20px',
                            borderRadius: 8,
                            boxShadow: '0 8px 24px rgba(0,0,0,.3)',
                            zIndex: 9999,
                        }}
                    >
                        I'm a portal in document.body. <br />
                        Clicking me won't close the menu.
                    </div>,
                    document.body
                )}
        </Section>
    )
}

// ─── 5. enabled ──────────────────────────────────────────────────────────────

function EnabledDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const [enabled, setEnabled] = useState(true)
    const ref = useRef<HTMLDivElement>(null)

    useClickOutside(ref, () => setOpen(false), { enabled })

    return (
        <Section title="5. enabled toggle" hint="Toggle the detector on the fly">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <button onClick={() => setOpen((v) => !v)}>{open ? 'Close' : 'Open'}</button>
                <button onClick={() => setEnabled((v) => !v)}>
                    Detector:{' '}
                    <span style={{ ...chip, background: enabled ? '#dcfce7' : '#fee2e2' }}>
                        {enabled ? 'ON' : 'OFF'}
                    </span>
                </button>
                {open && (
                    <div ref={ref} style={box}>
                        {enabled
                            ? 'Click outside — it closes.'
                            : 'Detector off — an outside click does nothing.'}
                    </div>
                )}
            </div>
        </Section>
    )
}

// ─── 6. onFocusOutside (tab-out) ───────────────────────────────────────────────

function FocusOutsideDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useClickOutside(ref, () => setOpen(false), {
        onFocusOutside: () => setOpen(false),
    })

    return (
        <Section
            title="6. onFocusOutside (Tab-out)"
            hint="Open it, focus the field and press Tab — focus leaves, the menu closes"
        >
            {open ? (
                <div ref={ref} style={box}>
                    <input placeholder="Type, then Tab" autoFocus />
                </div>
            ) : (
                <button onClick={() => setOpen(true)}>Open</button>
            )}
        </Section>
    )
}

// ─── 7. Multiple refs ──────────────────────────────────────────────────────────

function MultiRefDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const handleRef = useRef<HTMLDivElement>(null)

    // Both elements count as "inside" — click on either keeps the panel open.
    useClickOutside([panelRef, handleRef], () => setOpen(false))

    return (
        <Section
            title="7. Multiple refs"
            hint="Two separate regions count as 'inside' — clicking either won't close"
        >
            {open ? (
                <div style={{ display: 'flex', gap: 12 }}>
                    <div ref={handleRef} style={{ ...box, minWidth: 80 }}>
                        Handle
                    </div>
                    <div ref={panelRef} style={box}>
                        Panel. Click either of the two — it stays open.
                    </div>
                </div>
            ) : (
                <button onClick={() => setOpen(true)}>Open</button>
            )}
        </Section>
    )
}

// ─── 8. Layered overlays ───────────────────────────────────────────────────────

function LayeredDemo(): React.JSX.Element {
    const [outer, setOuter] = useState(false)
    const [inner, setInner] = useState(false)
    const outerRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)

    // enabled ties each layer's stack membership to whether it's actually open,
    // so only the open layers compete for "topmost".
    useClickOutside(outerRef, () => setOuter(false), { layered: true, enabled: outer })
    useClickOutside(innerRef, () => setInner(false), { layered: true, enabled: inner })

    return (
        <Section
            title="8. Layered (nested layers)"
            hint="Open both. An outside click closes only the top layer — inner first, then outer"
        >
            {outer ? (
                <div ref={outerRef} style={box}>
                    <p style={{ margin: '0 0 8px' }}>Outer layer</p>
                    {inner ? (
                        <div ref={innerRef} style={{ ...box, background: '#ede9fe' }}>
                            Inner layer (top)
                        </div>
                    ) : (
                        <button onClick={() => setInner(true)}>Open inner</button>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => {
                        setOuter(true)
                        setInner(false)
                    }}
                >
                    Open outer
                </button>
            )}
        </Section>
    )
}

// ─── 9. onClickInside + contextmenu ─────────────────────────────────────────────

function InsideAndContextDemo(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLDivElement>(null)

    // Right-click outside closes; onClickInside counts clicks inside.
    useClickOutside(ref, () => setOpen(false), {
        event: 'contextmenu',
        onClickInside: () => setCount((c) => c + 1),
    })

    return (
        <Section
            title="9. onClickInside + contextmenu"
            hint="Right-click outside closes. A normal click inside is counted"
        >
            {open ? (
                <div ref={ref} style={box}>
                    Clicks inside: <strong>{count}</strong>
                    <br />
                    Right-click outside — it closes.
                </div>
            ) : (
                <button
                    onClick={() => {
                        setOpen(true)
                        setCount(0)
                    }}
                >
                    Open
                </button>
            )}
        </Section>
    )
}

// ─── Layout ──────────────────────────────────────────────────────────────────

function Section({
    title,
    hint,
    children,
}: {
    title: string
    hint: string
    children: React.ReactNode
}): React.JSX.Element {
    return (
        <div
            style={{
                marginBottom: 40,
                paddingBottom: 40,
                borderBottom: '1px solid #e5e7eb',
            }}
        >
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{title}</h2>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>{hint}</p>
            {children}
        </div>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <div style={{ fontFamily: 'sans-serif', padding: '40px 48px', maxWidth: 640 }}>
            <h1 style={{ margin: '0 0 8px' }}>react-outlier</h1>
            <p style={{ color: '#6b7280', marginBottom: 48 }}>
                A demo of every useClickOutside feature
            </p>
            <BasicDemo />
            <EscapeDemo />
            <IgnoreDemo />
            <PortalDemo />
            <EnabledDemo />
            <FocusOutsideDemo />
            <MultiRefDemo />
            <LayeredDemo />
            <InsideAndContextDemo />
        </div>
    </StrictMode>
)
