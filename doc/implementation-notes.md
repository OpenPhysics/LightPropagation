# Implementation Notes - Light Propagation

Companion to [model.md](./model.md) (the physics); this file targets developers.

## Architecture Overview

Light Propagation is a four-screen SceneryStack simulation of light passing through polarizers
and wave plates, with a true-3D wave view rendered through `scenerystack/mobius` (three.js).
All four screens share one model core and one 3D display; each screen composes them with a
screen-appropriate initial state and control surface.

### High-Level Architecture

```
main.ts
  ├─ IntroScreen          one wave: polarization / amplitude / wavelength
  ├─ PolarizationScreen   two waves + sum, shared λ, κ-only material (polarizer)
  ├─ WavePlatesScreen     locked V+H basis, n-only material, QWP/HWP presets, retardation readout
  └─ LabScreen            full EMANIM parity: presets menu, all controls, permalinks

src/common/model/          plain axon classes — no mobius imports, fully unit-testable
  ├─ PolarizationType.ts   "vertical" | "horizontal" | "leftCircular" | "rightCircular"
  ├─ WaveEquations.ts      pure static math: region phase/decay, field components, B from E
  ├─ EMWave.ts             one wave's Properties (enabled, polarization, A, w, δ, reversed)
  ├─ OpticalMaterial.ts    slab Properties (enabled, m, n/κ per wave, sameAsWave1 coupling)
  ├─ FieldSampler.ts       static 289-point x-grid + preallocated Float32Array field buffers
  ├─ WaveSceneState.ts     serializable state type + defaults + merge + clamp/snap validator
  └─ WaveSceneModel.ts     the shared screen-model core (see below)

src/common/view/
  ├─ WaveDisplayNode.ts    the ONLY file importing scenerystack/mobius (see below)
  ├─ WaveSceneCamera.ts    yaw/pitch/range/parallel Properties + Nice/Side/Front/Back presets
  ├─ WaveScreenView.ts     shared ScreenView base: 3D node, time control, Reset All, layout
  ├─ WaveControlNode.ts    per-wave control block (options pick rows per screen)
  ├─ MaterialControlNode.ts material block (options pick n rows / κ rows / sameAsWave1)
  ├─ ViewControlNode.ts    camera presets + parallel projection + display toggles
  ├─ WaveTimeControlNode.ts themed TimeControlNode bound to the scene's timer/speed
  ├─ WaveKeyboardHelpContent.ts shared keyboard-help dialog (sliders, rotate-3D, time, combo)
  └─ summaryPhrases.ts     phrase Properties for the accessible screen summaries

src/lab/model/
  ├─ LabPresets.ts               the 20 EMANIM presets as PartialWaveSceneState entries
  └─ labQueryParameterMapping.ts pure permalink mapping (both directions)

src/preferences/
  └─ lightPropagationQueryParameters.ts  QueryStringMachine declarations (all public)
```

Data flows Model → View through AXON `Property` objects; the hot path (field sampling) instead
writes into preallocated `Float32Array` buffers once per frame.

## WaveSceneModel composition

`WaveSceneModel` is not subclassed. Every screen model **composes** it as `scene`, passing a
`PartialWaveSceneState` for the screen's startup configuration (Properties take their initial —
and therefore reset — values from it):

- Intro: defaults (wave 1 only) with E-vectors initially on.
- Polarization: both waves on (V + H), sum on; the model links wave 1's wavelength onto wave 2
  (one shared λ control).
- Wave Plates: V + H basis, sum on, material inserted as an exact quarter-wave plate; a
  `retardationRadiansProperty` is derived for the readout.
- Lab: state from the permalink query parameters (plain defaults when none given).

`step(dt)` advances the composed `TimeModel` by `dt · speedMultiplier · TIME_SCALE` (time is in
EMANIM axis units, see model.md) and refreshes the sampler; `stepFrame()` advances exactly one
EMANIM frame (π/18) for the step button. Per-frame sampling is allocation-free: the model reuses
snapshot structs and the `FieldSampler`'s buffers.

Cross-Property rules live in the model layer:
- Sum forced off when either wave is disabled (`WaveSceneModel` + the `clampWaveSceneState`
  validator).
- `OpticalMaterial.sameAsWave1Property`: checking copies wave 1's n/κ to wave 2 and keeps them
  tracking; a manual wave-2 edit unchecks it. A private `isCoupling` flag stops the copy itself
  from counting as a manual edit; `applyState()` writes under the same guard.

## Preset / permalink state flow

`WaveSceneState` is the single serializable field set exchanged by presets and permalinks
(display toggles and camera state are deliberately excluded, mirroring EMANIM).

- **Presets (Lab)**: `LabPresets.ts` holds 20 `{ key, category, state }` entries.
  `LabModel.presetProperty` applies `getLabPresetState(key)` via `scene.applyState()`; every
  Property in `scene.stateProperties` is watched and flips the selector to `"custom"` on manual
  edits (`scene.isApplyingState` guards out the bulk writes of applyState/reset).
- **Query parameters**: declarations live in `lightPropagationQueryParameters.ts` (all `public`,
  so bad values warn and fall back rather than crash). The pure mapping —
  `stateFromQueryParameters()` (defaults → preset → explicit overrides → clamp) and its inverse
  `queryStringFromState()` (Copy-link button; serializes only non-default parameters) — lives in
  `labQueryParameterMapping.ts` with no QueryStringMachine import, so it is unit-testable.
  `LabScreen` feeds the mapped state into `LabModel` as its initial state, so Reset All restores
  the permalinked configuration.

## The 3D view (mobius / three.js)

`WaveDisplayNode.ts` is the only file that imports `scenerystack/mobius`. Notes for maintainers:

- **ThreeIsometricNode pattern**: `MobiusScreenView` is *not* barrel-exported by scenerystack, so
  `WaveScreenView` replicates its plumbing: a full-ScreenView `ThreeIsometricNode` with
  `preventFit: true`, stage layout from `getGlobal("phet.joist.sim").dimensionProperty` (falling
  back to `window.inner*`), and `sceneNode.render()` called from `ScreenView.step()` after the
  model has stepped.
- **Parallel projection**: mobius's stage camera is hard-typed `PerspectiveCamera`, so parallel
  projection is emulated by narrowing the FOV from 15° to 0.5° while dollying out
  (distance = range / tan(fov/2)) — the same trick EMANIM uses.
- **Dynamic geometry**: curves are `THREE.Line` over `BufferGeometry` with a preallocated
  `BufferAttribute` marked `DynamicDrawUsage`; per-frame updates only write positions and set
  `needsUpdate`. Everything animated sets `frustumCulled = false` (the bounding sphere is never
  recomputed). The slab wirebox is rescaled (`scale.x = m`), never rebuilt.
- **Colors**: all three.js materials are linked to `LightPropagationColors`
  `ProfileColorProperty` instances via `ThreeUtils.colorToThree`, so projector mode restyles the
  3D scene too.
- **WebGL failure modes**: if WebGL is unavailable the node shows a localized warning instead
  (`stage.threeRenderer === null` is graceful); `contextLostEmitter` raises a reload `Dialog`
  (scenerystack does not export `ContextLossFailureDialog`).
- **Input**: orbit via `DragListener` on the background target, zoom via wheel, and a
  `KeyboardListener` (arrows rotate, +/− zoom) on the focusable viewport div for a11y parity with
  the camera preset buttons.

## Model/view test seam

vitest runs in happy-dom, which has no WebGL: **nothing under `src/common/model/`, `src/lab/model/`
or `tests/` may import mobius** (directly or transitively). The physics is therefore fully covered
by pure/axon-level tests (`WaveEquations`, `FieldSampler`, `WaveSceneModel`, `LabPresets`,
`labQueryParameterMapping`), and the 3D layer is verified manually against EMANIM side by side.

## Disposal

Screens live for the whole sim session (SceneryStack keeps them), so the usual PhET rule applies:
nothing here needs `dispose()` because nothing outlives its creator. The one deliberate exception
class — three.js resources — are created once per `WaveDisplayNode` and reused; geometry/material
teardown would only matter if screens were ever disposed dynamically.

## Known gaps / TODOs

- No home-screen icons yet — screens use the SceneryStack default `ScreenIcon`.
- `THREE.Line` renders 1 px on ANGLE/Windows; if thicker sum curves are wanted, switch to the jsm
  `Line2` (present in the pinned three@0.125.2) or a ribbon mesh.
- The es/fr translations were machine-drafted and marked for native review.
