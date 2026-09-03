/**
 * Step data contract for StepFlow diagrams (build-spec deliverable D3).
 *
 * Content travels with the slide: a diagram is data-in via props, never
 * global state. The six-step array below is the demo deck's seed content —
 * titles/subtexts measured verbatim from the reference (stepflow-visual-spec
 * art_0VvS7Nb1 §7–§8), icons keyed into the Lucide registry (icons.ts).
 */

export interface StepFlowStep {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Mono uppercase step title. */
  title: string
  /** One-line dim caption under the title. */
  subtext: string
  /** Key into the icon registry (`iconPath`); unknown keys render the fallback. */
  icon: string
}

/** The measured reference flow, as shipped on the demo slide. */
export const workflowSteps: StepFlowStep[] = [
  { id: 'branch', title: 'BRANCH', subtext: 'feature branches from main', icon: 'git-branch' },
  { id: 'code', title: 'MODULAR CODE', subtext: 'small reusable pieces', icon: 'square-terminal' },
  { id: 'test', title: 'TEST', subtext: 'guard the edge cases', icon: 'flask-conical' },
  { id: 'lint', title: 'LINT', subtext: 'enforce house style', icon: 'braces' },
  { id: 'ci', title: 'CI/CD', subtext: 'ship on every merge', icon: 'rotate-cw' },
  { id: 'infra', title: 'INFRA AS CODE', subtext: 'servers defined in git', icon: 'server' },
]
