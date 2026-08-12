# CLAUDE.md — Light Propagation

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

Four-screen SceneryStack simulation of electromagnetic waves through polarizers and wave plates,
with a true-3D wave view (`scenerystack/mobius`). All screens share `WaveSceneModel` in
`src/common/model/`; each screen composes it with screen-specific initial state and controls.
Faithful port of **EMANIM** (András Szilágyi).

Educator physics: [`doc/model.md`](doc/model.md). Architecture: [`doc/implementation-notes.md`](doc/implementation-notes.md).

| Screen | Folder | Focus |
|---|---|---|
| Intro | `src/intro/` | Single wave; polarization, amplitude, wavelength, 3D view |
| Polarization | `src/polarization/` | Two waves + sum; shared λ; κ-only material (polarizer) |
| Wave Plates | `src/wave-plates/` | Locked V+H basis; n-only material; QWP/HWP presets |
| Lab | `src/lab/` | Full EMANIM parity: 20 presets, all controls, permalinks |

Shared code uses the `LightPropagation` prefix; per-screen code uses `Intro` / `Polarization` /
`WavePlates` / `Lab`. Concept-named folders, no `-screen` suffix.

## Key files

| Area | Location |
|---|---|
| Shared physics | `src/common/model/WaveSceneModel.ts`, `WaveEquations.ts`, `FieldSampler.ts`, `EMWave.ts`, `OpticalMaterial.ts` |
| Shared views | `src/common/view/WaveDisplayNode.ts` (only mobius import), `WaveScreenView.ts`, control nodes |
| Lab presets / permalinks | `src/lab/model/LabPresets.ts`, `labQueryParameterMapping.ts` |
| Colors / constants / namespace | `LightPropagationColors.ts`, `LightPropagationConstants.ts`, `LightPropagationNamespace.ts` |
| Shared UI helpers | `src/common/LightPropagationPanel.ts`, `LightPropagationButtonOptions.ts`, `TimeModel.ts` |
| Screens | `src/intro/`, `src/polarization/`, `src/wave-plates/`, `src/lab/` — each `*Screen.ts`, `model/`, `view/` |
| i18n | `src/i18n/StringManager.ts`, `strings_*.json` |
| Query params | `src/preferences/lightPropagationQueryParameters.ts` |

## Model

- **Core:** `WaveSceneModel` holds two `EMWave`s, optional `OpticalMaterial` slab, sum toggle, and
  time speed. Field samples come from pure `WaveEquations` math on a fixed 289-point grid
  (`FieldSampler`).
- **Units:** EMANIM dimensionless units (c = 1), not SI. See `doc/model.md` for control → model
  mappings and region phase/decay equations.
- **State:** `WaveSceneState` is physics-only (presets + permalinks); camera/display toggles are
  excluded. Lab watches `scene.stateProperties` and flips to `"custom"` on manual edits.
- **Composition:** Screen models hold `scene: WaveSceneModel` with a `PartialWaveSceneState` for
  startup/reset — do not subclass the shared core.

## Accessibility

Follows the shared [OpenPhysics accessibility convention](https://github.com/OpenPhysics/Baton/blob/main/ACCESSIBILITY.md).
Each screen ships PDOM names, a `*ScreenSummaryContent`, and `*KeyboardHelpContent` with explicit
`pdomOrder`. A11y strings live under `a11y.<screenKey>` (`intro` / `polarization` / `wavePlates` /
`lab`) in each locale JSON, via `StringManager.getIntroA11yStrings()` /
`getPolarizationA11yStrings()` / `getWavePlatesA11yStrings()` / `getLabA11yStrings()`. Make each
`currentDetailsContent` a live `DerivedProperty` over model state.

## Testing

Fleet-standard Vitest layout (`happy-dom`, `tests/setup.ts`, `execArgv: ["--expose-gc"]`):

| Path | Purpose |
|---|---|
| `tests/TimeModel.test.ts` | Composable play/pause timer |
| `tests/WaveSceneModel.test.ts` | Shared core: state round-trip, reset, coupling rules |
| `tests/WaveEquations.test.ts` | Pure field math |
| `tests/FieldSampler.test.ts` | Grid sampling |
| `tests/LabPresets.test.ts` | 20 EMANIM preset states (and their mutual distinctness) |
| `tests/WavePlatesModel.test.ts` | Retardation Δφ, its displayed magnitude, QWP/HWP presets |
| `tests/labQueryParameterMapping.test.ts` | Permalink encode/decode |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression |

Put unit tests only under root `tests/` (never co-locate or use `__tests__/`). Run `npm test`; CI
runs the suite when a `test` script is present.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

`npm run release` intentionally skips `npm test` in some sims — append `&& npm test` before the version bump so a release cannot ship a failing suite.

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` + scripts project) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run icons` | Regenerate PWA icons |

## Development notes

- **Mobius boundary:** `WaveDisplayNode.ts` is the only file importing `scenerystack/mobius`; all
  model math stays in plain axon classes for unit testing.
- **Flat buttons / themed panels:** use `LightPropagationPanel` and `LightPropagationButtonOptions`
  so projector mode stays readable on dark panels.
- **Hot path:** field sampling writes into preallocated `Float32Array` buffers once per frame.
- **PWA:** after `npm run build`, installable offline via Workbox (`dist/manifest.webmanifest`).

## Compliance carve-outs

### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. LightPropagation keeps a higher `three` pin — do not force 0.125 there. |
| `brace-expansion` | `~5.0.9` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895). |
