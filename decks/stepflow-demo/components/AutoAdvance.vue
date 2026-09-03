<script setup lang="ts">
import { onSlideEnter, onSlideLeave, useNav } from '@slidev/client'
import { watch } from 'vue'
import { parseAutoplayParam, useAutoAdvance, type AutoAdvanceNav } from './stepflow/useAutoAdvance'

const props = defineProps<{
  /** Default run duration in seconds when ?autoplay carries no valid value (demo default: 7s). */
  durationSec?: number
}>()

/** Bridge the pure runner to Slidev's real navigation (verified in
 * @slidev/client/composables/useNav.ts: `next()` advances one click, or moves
 * to the next slide at the last one; `clicks`/`clicksTotal` mirror the
 * active slide's click state). */
const nav: AutoAdvanceNav = (() => {
  const real = useNav()
  return {
    clicks: () => real.clicks.value,
    clicksTotal: () => real.clicksTotal.value,
    next: () => { void real.next() },
  }
})()

const advance = useAutoAdvance({
  nav,
  durationMs: (props.durationSec ?? 7) * 1000,
})

// ?autoplay=N (or bare ?autoplay) hands-free-starts the run on slide enter —
// the recording workflow: open /2?autoplay=7 and hit record. Read at enter
// time (not setup): Slidev is an SPA, so a client-side navigation onto the
// slide never re-runs setup. Navigating away stops the run; re-entering with
// the param still in the URL replays it.
let pendingRunMs: number | null = null

function tryStartPendingRun(): void {
  if (pendingRunMs === null)
    return
  // The slide's click context registers after mount — entering a freshly
  // loaded slide can observe total === 0, where a run would silently no-op.
  // Hold the request until the click state is countable, then start.
  if (nav.clicksTotal() <= 0)
    return
  advance.start(pendingRunMs)
  pendingRunMs = null
}

onSlideEnter(() => {
  const autoplayMs = parseAutoplayParam(window.location.search, (props.durationSec ?? 7) * 1000)
  if (autoplayMs === null)
    return
  pendingRunMs = autoplayMs
  tryStartPendingRun()
})

watch(() => nav.clicksTotal(), tryStartPendingRun)

onSlideLeave(() => {
  pendingRunMs = null
  advance.stop()
})
</script>

<template>
  <!-- Renderless: comment-only output, zero slide chrome. -->
</template>
