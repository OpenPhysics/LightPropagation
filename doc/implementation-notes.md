# Implementation Notes - Light Propagation

Developer-facing notes on the architecture. The physics itself is documented for educators in
[model.md](./model.md).

## Architecture Overview

Light Propagation is a four-screen SceneryStack simulation of light passing through polarizers and
wave plates, with a true-3D wave view rendered through `scenerystack/mobius` (three.js). All four
screens share one model core and one 3D display; each screen composes them with a screen-appropriate
initial state and control surface.

```
main.ts
  ├─ IntroScreen          one wave: polarization / amplitude / wavelength
  ├─ PolarizationScreen   two waves + sum, shared λ, κ-only material (polarizer)
  ├─ WavePlatesScreen     locked V+H basis, n-only material, QWP/HWP presets
  └─ LabScreen            full EMANIM parity: presets menu, all controls, permalinks

src/common/model/          plain axon classes — no mobius imports, fully unit-testable
  ├─ PolarizationType.ts   "vertical" | "horizontal" | "leftCircular" | "rightCircular"
  ├─ WaveEquations.ts      pure static math: region phase/decay, field components, B from E
  ├─ EMWave.ts             one wave's Properties (enabled, polarization, A, w, δ, reversed)
  ├─ OpticalMaterial.ts    slab Properties (enabled, m, n/κ per wave, sameAsWave1 coupling)
  ├─ FieldSampler.ts       static 289-point x-grid + preallocated Float32Array field buffers
  ├─ WaveSceneState.ts     serializable state type + defaults + merge + clamp/snap validator
  └─ WaveSceneModel.ts     shared screen-model core (composed, not subclassed)

src/common/view/
  ├─ WaveDisplayNode.ts    the ONLY file importing scenerystack/mobius
  ├─ WaveSceneCamera.ts    yaw/pitch/range/parallel Properties + camera presets
  ├─ WaveScreenView.ts     shared ScreenView base: 3D node, time control, Reset All, layout
  └─ WaveControlNode.ts, MaterialControlNode.ts, ViewControlNode.ts, …

src/lab/model/
  ├─ LabPresets.ts               20 EMANIM presets as PartialWaveSceneState entries
  └─ labQueryParameterMapping.ts pure permalink mapping (both directions)
```

Data flows Model → View through AXON `Property` objects; the hot path (field sampling) writes into
preallocated `Float32Array` buffers once per frame instead.

## Key design decisions

- **Composition over inheritance.** Every screen model holds a `scene: WaveSceneModel` with a
  screen-specific `PartialWaveSceneState` for startup and reset. Cross-screen physics lives in
  `src/common/model/` only.
- **Serializable state is physics-only.** `WaveSceneState` (presets + permalinks) excludes camera
  and display toggles, mirroring EMANIM. Lab watches `scene.stateProperties` and flips to `"custom"`
  on manual edits (`scene.isApplyingState` guards bulk apply/reset).
- **Model/view test seam.** Vitest runs in happy-dom (no WebGL). Nothing under `src/common/model/`,
  `src/lab/model/`, or `tests/` may import mobius transitively — physics is fully unit-tested;
  the 3D layer is verified manually against EMANIM.
- **Mobius isolation.** `WaveDisplayNode.ts` alone imports three.js/mobius. `WaveScreenView`
  replicates the `ThreeIsometricNode` plumbing (not barrel-exported by scenerystack), calls
  `sceneNode.render()` from `ScreenView.step()` after the model steps, and emulates parallel
  projection by narrowing FOV while dollying out (EMANIM trick).

## Common components

- `LightPropagationPanel` — pre-themed panel; all control panels use it for automatic projector-mode switching.
- `LightPropagationButtonOptions` — flat button/combo-box option bundles (see `CLAUDE.md`).
- `TimeModel` — composable play/pause + elapsed time, composed into `WaveSceneModel` (time in EMANIM axis units).

## Preset / permalink flow

- **Presets (Lab):** `LabPresets.ts` → `LabModel.presetProperty` → `scene.applyState()`.
- **Query parameters:** declarations in `lightPropagationQueryParameters.ts` (all `public`);
  pure mapping in `labQueryParameterMapping.ts` (unit-testable, no QueryStringMachine import).
  `LabScreen` feeds mapped state as `LabModel`'s initial state so Reset All restores the permalink.

## Disposal

Screens live for the whole sim session, so nothing needs `dispose()` under normal use. Three.js
resources in `WaveDisplayNode` are created once per screen and reused.

## Testing

`npm test` (vitest):

- `tests/WaveSceneModel.test.ts`, `tests/TimeModel.test.ts` — physics and time stepping
- `tests/memory-leak.test.ts` — fleet-standard WeakRef/GC regression suite

Gate: `npm run check && npm run lint && npm run build && npm test`.

## Multi-screen pattern

Per-screen folders (`src/intro/`, `src/polarization/`, …), `StringManager` getters for screen
names and a11y (`getIntroA11yStrings()`, …), and shared physics in `src/common/`. See
`doc/multi-screen.md` for the fleet convention when adding screens.

## Known gaps

- Home-screen icons use the SceneryStack default `ScreenIcon`.
- `THREE.Line` renders 1 px on ANGLE/Windows; thicker sum curves would need `Line2` or a ribbon mesh.
- es/fr translations were machine-drafted and marked for native review.
