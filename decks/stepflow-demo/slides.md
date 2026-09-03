---
theme: default
title: StepFlow
info: Animated diagram system for Slidev — house style, one step per click.
canvasWidth: 1920
---

# StepFlow

Animated diagram system for Slidev — one step per click.

---

<!--
  Demo slide: each click pops one node and draws its track segment (six v-clicks,
  owned by the component). The stage div gives the SVG the full slide canvas.
-->

<div class="stepflow-stage">

<StepFlow
  title="SHIP FASTER"
  :steps="[
    { id: 'branch', title: 'BRANCH', subtext: 'feature branches from main', icon: 'git-branch' },
    { id: 'code', title: 'MODULAR CODE', subtext: 'small reusable pieces', icon: 'square-terminal' },
    { id: 'test', title: 'TEST', subtext: 'guard the edge cases', icon: 'flask-conical' },
    { id: 'lint', title: 'LINT', subtext: 'enforce house style', icon: 'braces' },
    { id: 'ci', title: 'CI/CD', subtext: 'ship on every merge', icon: 'rotate-cw' },
    { id: 'infra', title: 'INFRA AS CODE', subtext: 'servers defined in git', icon: 'server' },
  ]"
/>

</div>

<style>
/* The deck is black-canvas by design (build-scope boundary: no theme switching). */
.slidev-layout {
  background: #000;
}

.stepflow-stage {
  position: absolute;
  inset: 0;
}
</style>
