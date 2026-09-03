# StepFlow demo deck

Slidev deck for the StepFlow animated-diagram demo (`decks/stepflow-demo`).

> Scaffold stub — demo slides, the StepFlow component, and MCP usage docs land in follow-up PRs.

## Run (dev server + hot reload)

```bash
npm install        # once, from the repo root
npm run dev        # serves decks/stepflow-demo with hot reload
```

## Build (static SPA)

```bash
npm run build      # outputs decks/stepflow-demo/dist/
```

## Preview (built SPA)

```bash
npm run preview   # static-serves decks/stepflow-demo/dist/ (uses npx serve, no committed dep)
```

## Export (manual path)

PDF export requires `playwright-chromium`, which is intentionally **not** installed with the project:

```bash
npx playwright install chromium   # one-time browser download
npm run export                    # writes decks/stepflow-demo/export/deck.pdf
```

## MCP (coming in a later PR)

Slidev's built-in MCP server — stdio mode `npx slidev mcp decks/stepflow-demo`, HTTP mode `<dev-server>/__mcp` — will be documented and smoke-tested when the demo deck lands.
