// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TitleChrome from './TitleChrome.vue'
import { CHROME_GREEN, TITLE_WHITE, TOP_RIGHT_BADGE } from './chrome'

function mountChrome(props: Record<string, unknown>): ReturnType<typeof mount> {
  return mount(TitleChrome, { props })
}

describe('TitleChrome', () => {
  it('renders the cap-height prop as font size and the cap band as the baseline', () => {
    // MilestoneLanes sheet: cap 78, band top 98 → baseline 176.
    const wrapper = mountChrome({ title: 'DATA', titleAccent: 'ROADMAP', capHeight: 78, capTop: 98 })
    const text = wrapper.find('text.sf-chrome-title')
    expect(text.exists()).toBe(true)
    expect(Number(text.attributes('font-size'))).toBeCloseTo(78 / 0.752, 4)
    expect(Number(text.attributes('y'))).toBe(176)
    expect(text.attributes('text-anchor')).toBe('middle')
    expect(Number(text.attributes('x'))).toBe(960)
  })

  it('centers on the canvas center by default and honors the wave-1 sheet centers', () => {
    const centered = mountChrome({ title: 'DATA', capHeight: 52, capTop: 97 })
    expect(Number(centered.find('text.sf-chrome-title').attributes('x'))).toBe(960)

    // StairChain sheet measures the centered line spanning x184–1651 → center ≈917.
    const stair = mountChrome({ title: 'THE DATA ENGINEERING', titleAccent: 'LIFECYCLE', capHeight: 97, capTop: 48, centerX: 917 })
    expect(Number(stair.find('text.sf-chrome-title').attributes('x'))).toBe(917)
  })

  it('splits the two-tone header: white lead, chrome-green tail (titleAccent convention)', () => {
    const wrapper = mountChrome({ title: 'DATA', titleAccent: 'TOOLING', capHeight: 52, capTop: 97 })
    const html = wrapper.find('text.sf-chrome-title').html()
    expect(html).toContain(TITLE_WHITE)
    expect(html).toContain(CHROME_GREEN)
    const tspans = wrapper.findAll('tspan')
    expect(tspans).toHaveLength(2)
    expect(tspans[0].attributes('fill')).toBe(TITLE_WHITE)
    expect(tspans[0].text()).toBe('DATA')
    expect(tspans[1].attributes('fill')).toBe(CHROME_GREEN)
    expect(tspans[1].text()).toBe('TOOLING')
  })

  it('omits the tail tspan when no titleAccent is passed', () => {
    const wrapper = mountChrome({ title: 'DATA', capHeight: 52, capTop: 97 })
    expect(wrapper.findAll('tspan')).toHaveLength(1)
  })

  it('renders the green phrase FIRST for the accent-first families (VerticalSpine, SchematicRows)', () => {
    const wrapper = mountChrome({ title: 'CENTER AXIS', titleAccent: 'RHYTHM', capHeight: 84, capTop: 48, accentFirst: true })
    const tspans = wrapper.findAll('tspan')
    expect(tspans).toHaveLength(2)
    expect(tspans[0].attributes('fill')).toBe(CHROME_GREEN)
    expect(tspans[0].text()).toBe('RHYTHM')
    expect(tspans[1].attributes('fill')).toBe(TITLE_WHITE)
    expect(tspans[1].text()).toBe('CENTER AXIS')
  })

  it('renders the top-right badge only when the badge prop is set, at the sheet-measured box', () => {
    const without = mountChrome({ title: 'DATA', capHeight: 52, capTop: 97 })
    expect(without.find('.sf-top-right-badge').exists()).toBe(false)

    const withBadge = mountChrome({ title: 'DATA', titleAccent: 'TOOLING', capHeight: 52, capTop: 97, badge: true })
    const rect = withBadge.find('.sf-top-right-badge')
    expect(rect.exists()).toBe(true)
    expect(Number(rect.attributes('x'))).toBe(TOP_RIGHT_BADGE.x)
    expect(Number(rect.attributes('y'))).toBe(TOP_RIGHT_BADGE.y)
    expect(Number(rect.attributes('width'))).toBe(TOP_RIGHT_BADGE.width)
    expect(Number(rect.attributes('height'))).toBe(TOP_RIGHT_BADGE.height)
    // Pill: fully-rounded ends.
    expect(Number(rect.attributes('rx'))).toBe(TOP_RIGHT_BADGE.height / 2)
    expect(rect.attributes('fill')).toBe('#7ca424')
  })

  it('renders nothing when neither title nor titleAccent is set', () => {
    const wrapper = mountChrome({ capHeight: 52, capTop: 97 })
    expect(wrapper.find('text.sf-chrome-title').exists()).toBe(false)
  })
})
