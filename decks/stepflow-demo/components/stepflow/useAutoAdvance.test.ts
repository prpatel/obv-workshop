// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { DEFAULT_CANCEL_KEYS, parseAutoplayParam, useAutoAdvance, type AutoAdvanceController, type AutoAdvanceNav, type UseAutoAdvanceOptions } from './useAutoAdvance'

/**
 * Mock nav boundary: the runner is only allowed to advance a click while one
 * remains — advancing past the final click would move to the next slide, so
 * the mock throws to prove the runner never overshoots.
 */
function mockNav(total: number, initial = 0) {
  const state = { clicks: initial, total, nextCalls: 0 }
  const nav: AutoAdvanceNav = {
    clicks: () => state.clicks,
    clicksTotal: () => state.total,
    next: () => {
      if (state.clicks >= state.total)
        throw new Error('advanced past the final click')
      state.nextCalls += 1
      state.clicks += 1
    },
  }
  return { nav, state }
}

function mountAdvance(opts: Omit<UseAutoAdvanceOptions, 'nav'> & { nav: AutoAdvanceNav }) {
  let ctrl!: AutoAdvanceController
  const wrapper = mount(defineComponent({
    setup() {
      ctrl = useAutoAdvance(opts)
      return () => null
    },
  }))
  return { wrapper, ctrl }
}

/** Press a key on `window` the way Slidev's own shortcut layer sees it. */
function press(key: string, init: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('parseAutoplayParam', () => {
  it('parses N seconds into ms and ignores unrelated params', () => {
    expect(parseAutoplayParam('?autoplay=7', 7000)).toBe(7000)
    expect(parseAutoplayParam('?autoplay=12', 7000)).toBe(12000)
    expect(parseAutoplayParam('?autoplay=2.5&clicks=3', 7000)).toBe(2500)
    expect(parseAutoplayParam('?clicks=3', 7000)).toBe(null)
  })

  it('falls back to the demo default for bare or invalid values', () => {
    expect(parseAutoplayParam('?autoplay', 7000)).toBe(7000)
    expect(parseAutoplayParam('?autoplay=', 7000)).toBe(7000)
    expect(parseAutoplayParam('?autoplay=abc', 7000)).toBe(7000)
    expect(parseAutoplayParam('?autoplay=0', 7000)).toBe(7000)
    expect(parseAutoplayParam('?autoplay=-3', 7000)).toBe(7000)
  })
})

describe('useAutoAdvance', () => {
  it('advances evenly across the duration, first step one interval in', () => {
    // 6 clicks over 7s → spacing 7000/6 ≈ 1166.67ms (the demo default).
    const { nav, state } = mockNav(6)
    const { ctrl } = mountAdvance({ nav, durationMs: 7000 })

    press('a')
    vi.advanceTimersByTime(1166) // < 1166.67
    expect(state.nextCalls).toBe(0)
    vi.advanceTimersByTime(1) // 1167 ≥ 1166.67
    expect(state.nextCalls).toBe(1)

    // Each further advance lands ~1166.67ms apart.
    for (let i = 2; i <= 6; i++) {
      vi.advanceTimersByTime(1167)
      expect(state.nextCalls).toBe(i)
    }
    expect(ctrl.isRunning()).toBe(false)
  })

  it('spaces the remaining clicks from the current position', () => {
    // Resume with 2 of 6 clicks already shown: 4 left over 7s → 1750ms apart.
    const { nav, state } = mockNav(6, 2)
    mountAdvance({ nav, durationMs: 7000 })

    press('a')
    vi.advanceTimersByTime(1749)
    expect(state.nextCalls).toBe(0)
    vi.advanceTimersByTime(1)
    expect(state.nextCalls).toBe(1)
    vi.advanceTimersByTime(1750)
    expect(state.nextCalls).toBe(2)
  })

  it('auto-starts when the autoStart option is set', () => {
    const { nav, state } = mockNav(6)
    mountAdvance({ nav, durationMs: 6000, autoStart: true })

    vi.advanceTimersByTime(6000)
    expect(state.nextCalls).toBe(6)
  })

  it('never starts when already at the final click', () => {
    const { nav, state } = mockNav(6, 6)
    const { ctrl } = mountAdvance({ nav, durationMs: 6000, autoStart: true })

    vi.advanceTimersByTime(60000)
    expect(state.nextCalls).toBe(0)
    expect(ctrl.isRunning()).toBe(false)
  })

  it("the a key toggles start/stop and resumes with recomputed spacing", () => {
    const { nav, state } = mockNav(6)
    const { ctrl } = mountAdvance({ nav, durationMs: 6000 })

    press('a')
    expect(ctrl.isRunning()).toBe(true)
    vi.advanceTimersByTime(3000) // 1000ms spacing → 3 advances
    expect(state.nextCalls).toBe(3)

    press('a')
    expect(ctrl.isRunning()).toBe(false)
    vi.advanceTimersByTime(10000)
    expect(state.nextCalls).toBe(3) // stopped mid-run

    // Resume: remaining 3 clicks spread over the default 6s → 2000ms apart.
    press('a')
    vi.advanceTimersByTime(1999)
    expect(state.nextCalls).toBe(3)
    vi.advanceTimersByTime(1)
    expect(state.nextCalls).toBe(4)
    vi.advanceTimersByTime(4000)
    expect(state.nextCalls).toBe(6)
    expect(ctrl.isRunning()).toBe(false)
  })

  it('accepts shift+a and ignores modifier chords like ctrl+a', () => {
    const { nav, state } = mockNav(6)
    const { ctrl } = mountAdvance({ nav, durationMs: 6000 })

    press('a', { ctrlKey: true })
    vi.advanceTimersByTime(5000)
    expect(state.nextCalls).toBe(0) // chord: not a toggle

    press('A')
    vi.advanceTimersByTime(1000)
    expect(state.nextCalls).toBe(1) // case-insensitive toggle started the run
    expect(ctrl.isRunning()).toBe(true)
  })

  it('cancels on manual navigation keys', () => {
    for (const key of DEFAULT_CANCEL_KEYS) {
      const { nav, state } = mockNav(6)
      const { ctrl } = mountAdvance({ nav, durationMs: 6000 })

      press('a')
      press(key)
      vi.advanceTimersByTime(10000)
      expect(state.nextCalls).toBe(0)
      expect(ctrl.isRunning()).toBe(false)
    }
  })

  it('keeps running when a modifier chord containing a nav key is pressed', () => {
    const { nav, state } = mockNav(6)
    mountAdvance({ nav, durationMs: 6000 })

    press('a')
    press('ArrowRight', { ctrlKey: true }) // e.g. an editor shortcut, not navigation
    vi.advanceTimersByTime(1000)
    expect(state.nextCalls).toBe(1)
  })

  it('stops cleanly at the final click and never advances past it', () => {
    const { nav, state } = mockNav(6)
    const { ctrl } = mountAdvance({ nav, durationMs: 6000 })

    press('a')
    vi.advanceTimersByTime(6000)
    expect(state.nextCalls).toBe(6)
    vi.advanceTimersByTime(60000) // the strict mock would throw on overshoot
    expect(state.nextCalls).toBe(6)
    expect(ctrl.isRunning()).toBe(false)
  })

  it('stops without advancing when another surface reaches the final click mid-run', () => {
    const { nav, state } = mockNav(6)
    const { ctrl } = mountAdvance({ nav, durationMs: 6000 })

    press('a')
    vi.advanceTimersByTime(2000) // 2 advances
    state.clicks = state.total // external drift (e.g. presenter sync)
    vi.advanceTimersByTime(10000)
    expect(state.nextCalls).toBe(2)
    expect(ctrl.isRunning()).toBe(false)
  })

  it('guards against double-start', () => {
    const { nav, state } = mockNav(6)
    const { ctrl } = mountAdvance({ nav, durationMs: 6000 })

    press('a')
    ctrl.start()
    ctrl.start()
    vi.advanceTimersByTime(6000)
    expect(state.nextCalls).toBe(6) // one cadence, not three
  })

  it('cleans up timers and key listeners on unmount', () => {
    const { nav, state } = mockNav(6)
    const { wrapper, ctrl } = mountAdvance({ nav, durationMs: 6000 })

    press('a')
    wrapper.unmount()
    vi.advanceTimersByTime(60000)
    expect(state.nextCalls).toBe(0) // interval gone

    press('a') // listener gone: no restart
    vi.advanceTimersByTime(60000)
    expect(state.nextCalls).toBe(0)
    expect(ctrl.isRunning()).toBe(false)
  })
})
