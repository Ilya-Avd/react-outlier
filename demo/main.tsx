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
        <Section title="1. Basic" hint="Кликни снаружи синей рамки">
            {open ? (
                <div ref={ref} style={box}>
                    Я открыт. Кликни за пределами.
                </div>
            ) : (
                <button onClick={() => setOpen(true)}>Открыть</button>
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
        <Section title="2. Escape key" hint="Нажми Escape или кликни снаружи">
            {open ? (
                <div ref={ref} style={box}>
                    Закрывается по Escape и клику снаружи.
                </div>
            ) : (
                <button onClick={() => setOpen(true)}>Открыть</button>
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
            hint="Кнопка-триггер игнорируется — меню корректно переключается"
        >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <button ref={triggerRef} onClick={() => setOpen((v) => !v)}>
                    {open ? 'Закрыть' : 'Открыть'} меню
                </button>
                {open && (
                    <div ref={menuRef} style={box}>
                        Кликни по кнопке ещё раз — закроется. <br />
                        Кликни здесь — останется открытым.
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
            hint="Тултип рендерится в document.body, но не закрывает меню"
        >
            <div ref={menuRef} style={box}>
                <p style={{ margin: '0 0 8px' }}>Меню (в обычном DOM)</p>
                <button onClick={() => setOpen((v) => !v)}>
                    {open ? 'Скрыть' : 'Показать'} тултип из портала
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
                        Я портал в document.body. <br />
                        Клик по мне не закроет меню.
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
        <Section title="5. enabled toggle" hint="Включай / выключай детектор на лету">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <button onClick={() => setOpen((v) => !v)}>{open ? 'Закрыть' : 'Открыть'}</button>
                <button onClick={() => setEnabled((v) => !v)}>
                    Детектор:{' '}
                    <span style={{ ...chip, background: enabled ? '#dcfce7' : '#fee2e2' }}>
                        {enabled ? 'ON' : 'OFF'}
                    </span>
                </button>
                {open && (
                    <div ref={ref} style={box}>
                        {enabled
                            ? 'Кликни снаружи — закроется.'
                            : 'Детектор выключен — клик снаружи ничего не делает.'}
                    </div>
                )}
            </div>
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
                Демо всех возможностей хука useClickOutside
            </p>
            <BasicDemo />
            <EscapeDemo />
            <IgnoreDemo />
            <PortalDemo />
            <EnabledDemo />
        </div>
    </StrictMode>
)
