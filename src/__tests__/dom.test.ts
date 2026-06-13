import { type RefObject } from 'react'
import { describe, expect, it } from 'vitest'

import {
    collectElements,
    isScrollbarClick,
    normalizeRefs,
    pathHits,
    resolveRoots,
} from '../internal/dom'

import { mockClientArea } from './helpers'

const ref = <T>(current: T): RefObject<T> => ({ current })

describe('internal/dom', () => {
    describe('normalizeRefs', () => {
        it('wraps a single ref in an array', () => {
            const r = ref<HTMLElement | null>(null)
            expect(normalizeRefs(r)).toEqual([r])
        })

        it('returns an array of refs unchanged', () => {
            const refs = [ref<HTMLElement | null>(null), ref<HTMLElement | null>(null)]
            expect(normalizeRefs(refs)).toBe(refs)
        })
    })

    describe('collectElements', () => {
        it('returns mounted elements and drops nulls', () => {
            const el = document.createElement('div')
            const refs = [ref<HTMLDivElement | null>(el), ref<HTMLDivElement | null>(null)]
            expect(collectElements(refs)).toEqual([el])
        })

        it('returns an empty array for undefined', () => {
            expect(collectElements(undefined)).toEqual([])
        })
    })

    describe('pathHits', () => {
        it('is true when the path includes one of the elements', () => {
            const el = document.createElement('div')
            expect(pathHits([el, document.body], [el])).toBe(true)
        })

        it('is false when the path misses every element', () => {
            const el = document.createElement('div')
            const other = document.createElement('span')
            expect(pathHits([other], [el])).toBe(false)
        })

        it('is false against an empty element list', () => {
            expect(pathHits([document.body], [])).toBe(false)
        })
    })

    describe('resolveRoots', () => {
        it('defaults to [document]', () => {
            expect(resolveRoots(undefined)).toEqual([document])
        })

        it('returns the provided roots', () => {
            const roots = [document]
            expect(resolveRoots(roots)).toBe(roots)
        })
    })

    describe('isScrollbarClick', () => {
        it('is true for coordinates past the client area', () => {
            const restore = mockClientArea(800, 600)
            expect(
                isScrollbarClick(new MouseEvent('mousedown', { clientX: 810, clientY: 100 }))
            ).toBe(true)
            expect(
                isScrollbarClick(new MouseEvent('mousedown', { clientX: 100, clientY: 610 }))
            ).toBe(true)
            restore()
        })

        it('is false within the client area', () => {
            const restore = mockClientArea(800, 600)
            expect(
                isScrollbarClick(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }))
            ).toBe(false)
            restore()
        })
    })
})
