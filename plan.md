# Plan: Incorporate EMANIM features into the Light Propagation sim

## Context

The Light Propagation sim (four SceneryStack screens: Intro, Polarization, Wave Plates, Lab) is pure scaffolding — placeholder text + Reset All on every screen, empty models. This plan brings in the feature set of **EMANIM** (https://emanim.szialab.org), a 3D electromagnetic-wave animation app: two superposable EM waves, a material slab whose per-wave refractive index n and extinction coefficient κ produce absorption, refraction, dichroism (polarizers), birefringence (wave plates) and optical activity, a rotatable 3D wave view with camera presets, and a 20-item preset-phenomena menu.

Physics ground truth comes from two cross-validating sources: the classic EMANIM Python source supplied by the user (https://emanimclassic.szialab.org/emanim12_python2or3.py, saved in scratchpad as `emanim12.py`) and the web app's main.js/phenomena.js. Both give the same equations, ranges, and presets.

**Decisions (user-confirmed, do not revisit):**
- Rendering: **true 3D via `scenerystack/mobius`** (three@0.125.2 bundled, verified installed).
- **Progressive build-up**: Intro = one wave; Polarization = two-wave superposition + dichroic polarizer; Wave Plates = birefringence/QWP/HWP; Lab = full EMANIM parity + presets menu.
- Include: presets menu, permalink query parameters, B-field toggle. Exclude: GIF export, per-curve color pickers (projector mode + `LightPropagationColors` covers theming).
- **Absorption law: EMANIM's form** exp(−κ·Δx/π) (wavelength-independent) for exact parity; relation to physical Beer–Lambert documented in doc/model.md.
- **Polarization screen: one shared wavelength control** for both waves; unequal-λ effects are Lab-only.

## Ground-truth physics (port exactly; dimensionless EMANIM units, c = 1)

### Domain & controls
- Propagation axis x ∈ [−8π, 8π], sample step π/18 → **289 points**; material slab centered at origin.
- Ranges (slider → model): amplitude A 0–10 step 1 default 5 · wavelength number w 1–8 int default 4 (reduced wavelength ƛ = w/4; λ = w·π/2) · phase difference δ −180°..180° step 10° default 0 (wave 2 only) · material length m 1–32 int default 16 (L = m·π/2) · n 1.00–2.00 step 0.05 default 1.00 (per wave) · κ 0.00–1.00 step 0.05 default 0.00 (per wave) · time: t advances π/18 per frame at 30 fps ⇒ `TIME_SCALE ≈ 5.236` axis-units/s.

### Wave field
ω = 1/ƛ. Direction sign d = −1 iff wave 1 "Reverse direction"; propagation coordinate **ξ = d·x** (slab comparisons on ξ auto-mirror for reversed waves). Slab edges ξ_in = −L/2, ξ_out = +L/2. Phase Φ and decay D per region:
- **Before / no material** (ξ < ξ_in): Φ = ξ/ƛ − ωt + δ, D = 1
- **Inside** (ξ_in ≤ ξ < ξ_out): Φ = n·ξ/ƛ − ωt + δ + φₐ, φₐ = ξ_in(1−n)/ƛ; **D = exp(−κ(ξ−ξ_in)/π)**
- **After** (ξ ≥ ξ_out): Φ = ξ/ƛ − ωt + δ + φ_b, **φ_b = (n−1)·L/ƛ** (= the retardation); D = exp(−κL/π)

φₐ/φ_b make the phase continuous at both interfaces (verified algebraically against both sources).

Transverse components (y = vertical, z = other transverse axis; web-app sign conventions, mirror verbatim and document rather than "fix"):
- Vertical: e_y = A·D·sinΦ, e_z = 0 · Horizontal: e_z = **−**A·D·sinΦ, e_y = 0
- Left circular: e_z = A·D·sinΦ, e_y = A·D·sin(Φ − π/2) · Right circular: e_y phase **+π/2**
- Superposition = componentwise sum; standing wave = wave 1 reversed + wave 2 forward, equal λ.
- **B-field (our extension)**: per wave B = d·(0, −e_z, e_y) (k̂ × E, display-scaled; n-scaling inside medium ignored — document as simplification). B ⟂ E by construction (test it).

### Scene furniture & cameras
Axis line ±8π; square frame (half-size 6) + y/z crosshairs at each end; E-vector arrows at **both ends** of each visible curve (sum arrow thicker); yellow construction lines connecting component arrow tips → sum arrow tip at each end when sum is shown; material wirebox L × 12 × 12 (+ faint translucent box fill). Sum curve rendered thicker than components.
Camera: FOV 15° (π/12), view range 20 (camera distance = range/tan(fov/2)); forward presets — **Nice** (−0.669, −0.223, −0.708)·norm, **Side** (0,0,−1), **Front** (−1,0,0), **Back** (1,0,0). Parallel projection = FOV→0.5° dolly trick (EMANIM does the same; mobius camera is hard-typed PerspectiveCamera). Free orbit (drag) + zoom (wheel), "hide curves" leaves arrows animating.

### The 20 presets (defaults elsewhere: A=5, w=4, δ=0, m=16, n=1, κ=0; sum auto-unchecks if either wave off — replicate)
| Preset | Config |
|---|---|
| Vertical | W1 Vertical only |
| Horizontal | **W2** Horizontal only (EMANIM quirk — keep: H stays wave-2-colored) |
| Left circular | W1 LC only |
| Right circular | W2 RC only |
| Linear+linear 1 | W1 V + W2 H, sum, δ=0 |
| Linear+linear 2 | W1 V + W2 H, sum, **δ=−90°** (classic used +90°; use web value) |
| Left+right circular | W1 LC + W2 RC, sum, δ=+90° |
| λ ratio 1:1 / 1:8 / 7:8 | W1 V + W2 V, sum; w = (4,4) / (1,8) / (7,8) |
| Standing wave | W1 V **reversed** + W2 V, sum |
| Absorption | W1 V, mat: κ₁=0.25 |
| Refraction | W1 V, mat: n₁=1.50 |
| Abs.+refraction | W1 V, mat: n₁=1.50, κ₁=0.25 |
| Linear dichroism | W1 V + W2 H, sum, mat: κ₁=0.15 |
| Linear birefringence | 〃 mat: n₁=1.05 |
| Lin. dichr.+biref. | 〃 mat: n₁=1.05, κ₁=0.15 |
| Circular dichroism | W1 LC + W2 RC, sum, mat: κ₁=0.15 |
| Circular birefringence | 〃 mat: n₁=1.05 (optical rotation) |
| Circ. dichr.+biref. | 〃 mat: n₁=1.05, κ₁=0.15 |

## Architecture

### Model layer — `src/common/model/` (new; plain axon classes, no mobius imports, fully unit-testable)
- **`PolarizationType.ts`** — `"vertical" | "horizontal" | "leftCircular" | "rightCircular"` const-array + type; use `StringUnionProperty` (verified in `scenerystack/axon`).
- **`WaveEquations.ts`** — pure static math (no axon): `phaseAndDecay(x, t, wave, mat)`, `fieldComponents(...)`, `magneticFromElectric(...)` over snapshot structs; implements the region equations above. The testable core; allocation-free hot loop.
- **`EMWave.ts`** — Properties: `enabledProperty`, `polarizationProperty`, `amplitudeProperty`, `wavelengthProperty` (int w), `phaseDegreesProperty`, `reversedProperty`; `toSnapshot(out)`; `reset()`.
- **`OpticalMaterial.ts`** — `enabledProperty`, `lengthProperty`, per-wave `{refractiveIndexProperty, extinctionProperty}`, `sameAsWave1Property` with EMANIM coupling (check → copy+track w1; manual w2 edit → auto-uncheck; reentrancy-guarded).
- **`FieldSampler.ts`** — owns static 289-point x-grid + preallocated Float32Array buffers (wave1/wave2/sum × E/B, eY,eZ interleaved); `sample(t, snapshots…)` fills per frame.
- **`WaveSceneState.ts`** — serializable full-state type (the permalink/preset field set) + defaults + clamping validator.
- **`WaveSceneModel.ts`** — the shared screen-model core: composes `TimeModel` (existing, untouched) + `timeSpeedProperty` (`TimeSpeed` slow/normal/fast), `wave1`, `wave2`, `material`, `sumEnabledProperty`, `componentCurvesVisibleProperty`, `sumCurveVisibleProperty`, `eVectorsVisibleProperty`, `bFieldVisibleProperty`, `sampler`; `step(dt)` (dt × speed × TIME_SCALE), `applyState()/getState()`, `reset()`. Enforces sum-off-when-wave-off.

### 3D view layer — `src/common/view/`
- **`WaveDisplayNode.ts`** — the only file importing `scenerystack/mobius`. Full-ScreenView **`ThreeIsometricNode`** (copy patterns from `node_modules/scenerystack/src/mobius/js/MobiusScreenView.ts` — it is NOT barrel-exported), `backgroundColorProperty: LightPropagationColors.backgroundColorProperty`, `viewOffset` shifting scene left of the control panels, `preventFit: true` on ScreenView. three@0.125-safe API only: `THREE.Line` + `BufferGeometry`/`BufferAttribute` with `DynamicDrawUsage`, `frustumCulled = false`, per-frame position writes from `FieldSampler` buffers; `THREE.ArrowHelper` end arrows (hide below ε length; optional along-axis arrows every 8th sample); static axis/frame lines; slab wirebox with `scale.x = m` (never rebuild geometry); colors linked via `ThreeUtils.colorToThree`. WebGL-unavailable fallback (localized warning Text; `stage.threeRenderer === null` is graceful); `contextLostEmitter` → `Dialog` from `scenerystack/sim` (`ContextLossFailureDialog` is not exported). Render in `ScreenView.step` → `sceneNode.render()`; layout via `sceneNode.layout(w,h)` using `getGlobal("phet.joist.sim").dimensionProperty` (fallback `window.inner*`).
- **`WaveSceneCamera.ts`** — `yawProperty`/`pitchProperty` (clamp ±89°)/`rangeProperty` (6–60, default 20)/`parallelProjectionProperty` (FOV 15°→0.5°); presets Nice/Side/Front/Back from the forward vectors; `DragListener` on `backgroundEventTarget` for orbit, wheel zoom, and `KeyboardListener` (arrows rotate, +/− zoom) on a focusable div for a11y parity.
- **Shared 2D controls**: `WaveControlNode.ts` (per-wave block; options select rows: enable checkbox, polarization radio group, amplitude/wavelength/phase `NumberControl`s, reverse checkbox) · `MaterialControlNode.ts` (options hide n or κ rows per screen) · `ViewControlNode.ts` (camera preset buttons + parallel-projection/E-vectors/B-field/show-components/show-sum checkboxes) · `WaveTimeControlNode.ts` (`TimeControlNode` wrapper spreading `FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS` + `TIME_CONTROL_SPEED_RADIO_OPTIONS`) · `LightPropagationControlOptions.ts` (`SIM_NUMBER_CONTROL_OPTIONS`, `SIM_CHECKBOX_OPTIONS` companions to the existing button bundles). All panels wrapped in existing `LightPropagationPanel`.

### Screens (each `*Model` composes `scene: WaveSceneModel` with screen-appropriate initial state; each `*ScreenView` = WaveDisplayNode + right panel stack + time control bottom-center + ResetAll + full pdomOrder)
- **Intro**: wave 1 only (wave 2 off, material off). Polarization radio, amplitude, wavelength, E-vectors (default ON here), B-field, view controls.
- **Polarization**: both waves always on; per-wave polarization/amplitude; **one shared wavelength control**; phase difference; sum checkbox; material with **κ only** (n locked 1.00), labeled as dichroic filter/polarizer. Initial state = Linear+linear 1.
- **Wave Plates**: basis locked (W1 Vertical, W2 Horizontal), per-wave amplitude, phase, sum on; material with **n only** (κ locked 0), fast/slow-axis labels; **retardation readout** Δφ = (n₁−n₂)·L/ƛ in degrees and waves (DerivedProperty → RichText); **QWP/HWP preset buttons** — exact on-grid values at w=4: QWP = {m 20, n₁ 1.05, n₂ 1.00} → Δφ = π/2; HWP = {m 20, n₁ 1.10} → Δφ = π (default m=16 can't hit π/2 with 0.05 n-steps).
- **Lab**: full parity — wave enable checkboxes, all per-wave controls incl. independent λ and reverse, full material (n & κ per wave + sameAsWave1), all display toggles, presets ComboBox, query-param initial state.

### Presets (Lab)
`src/lab/model/LabPresets.ts` — 20 `{key, state: Partial<WaveSceneState>}` entries per the table. `LabModel.presetProperty: Property<PresetKey | "custom">`; applying goes through `scene.applyState()` under a guard; any manual Property change flips to `"custom"`. `LabPresetComboBox.ts` with `SIM_COMBO_BOX_OPTIONS` + `LIGHT_SURFACE_TEXT_FILL`; flat list with category-prefixed labels (sun ComboBox has no separators), e.g. "Interference: Standing wave".

### Permalink query parameters
Replace `exampleToggle` in `src/preferences/lightPropagationQueryParameters.ts` with public validated params (Lab initial state): `preset`, `wave1`/`wave2` (`off|vertical|horizontal|leftCircular|rightCircular`), `amplitude1/2` (0–10), `wavelength1/2` (int 1–8), `phase` (−180–180), `reverse1`/`sum`/`material`/`sameAsWave1` (booleans), `materialLength` (int 1–32), `n1`/`n2` (1–2), `kappa1`/`kappa2` (0–1). Application order: defaults → preset → explicit params. Pure mapper `stateFromQueryParameters()` in `src/lab/model/` (unit-testable sans QSM). Polish: "Copy link" button serializing `getState()` → non-default params via `navigator.clipboard`.

### i18n (add to en+es+fr simultaneously — parity is compile-enforced; real translations, not English placeholders, noting "needs native review")
New `controls.*` (wave labels, polarization names, amplitude/wavelength/phaseDifference/reverseDirection, sum, material.*, display.*, views.*, degreesPattern), `presets.*` (title "Show me", custom, 20 keys + 6 category names), `wavePlatesControls.*` (quarterWave, halfWave, retardationPattern, fastAxis, slowAxis). Per-screen `a11y.<screen>.controls.*`, `a11y.<screen>.waveView.{accessibleName, accessibleHelpText}`, rewritten `screenSummary.*`, `currentDetailsPattern` for `PatternStringProperty`. `StringManager` gains `getControlsStrings()`, `getPresetsStrings()`, `getWavePlatesControlsStrings()`.

### A11y
`accessibleName` (+ helpText where non-obvious) on every control; 3D viewport = focusable div with arrow/±-key camera control (preset buttons remain the primary non-pointer path); pdomOrder: (Lab: presets first) → wave 1 → wave 2 → material → display/view → 3D viewport → time control → Reset All; `currentDetailsContent` as live `PatternStringProperty` over polarization/amplitude/λ/material/playing; keyboard help: add `SliderControlsKeyboardHelpSection` + `TimeControlsKeyboardHelpSection` (all screens), `ComboBoxKeyboardHelpSection` (Lab), custom "Rotate 3D view" section (all verified `scenerystack/scenery-phet` exports).

### Colors & constants
`LightPropagationColors.ts` (default/projector): `wave1Color` #ff4444/#cc0000, `wave2Color` #44dd44/#008800, `superpositionColor` #00ffff/#008080, `bField1/2/SumColor` (violet family, dimmer), `materialColor` #ff8000/#b35900, `axes3DColor` #4c4c4c/#aaaaaa, `constructionLineColor` #ffff00/#999900.
`LightPropagationConstants.ts` (documented as EMANIM arbitrary units): `WAVE_AXIS_HALF_LENGTH = 8π`, `WAVE_SAMPLE_COUNT = 289`, `AMPLITUDE_RANGE`, `WAVELENGTH_NUMBER_RANGE`, `WAVELENGTH_UNIT = π/2`, `PHASE_DEGREES_RANGE` + step 10, `MATERIAL_LENGTH_RANGE`, `MATERIAL_UNIT_LENGTH = π/2`, `REFRACTIVE_INDEX_RANGE`, `EXTINCTION_RANGE`, `INDEX_STEP = 0.05`, `TRANSVERSE_FRAME_HALF_SIZE = 6`, `MATERIAL_CROSS_SECTION = 12`, `TIME_SCALE = 30π/18`, `CAMERA_FOV_DEGREES = 15`, `CAMERA_PARALLEL_FOV_DEGREES = 0.5`, `CAMERA_RANGE`, `NICE_VIEW_FORWARD`.

## Testing (vitest, model layer only — happy-dom has no WebGL; nothing under `src/common/model/` or `tests/` may import mobius)
- `tests/WaveEquations.test.ts` — vacuum values at known (x,t); **phase continuity at both interfaces** for assorted (n, w, reversed); decay 1/monotone/frozen-at-exp(−κL/π); post-slab phase = (n−1)L/ƛ; circular components 90° apart; horizontal sign; reversed wave enters slab from +x; B ⟂ E, B sign flips on reversal.
- `tests/FieldSampler.test.ts` — buffer shapes; sum = w1+w2; standing wave has fixed nodes and 2A antinodes.
- `tests/WaveSceneModel.test.ts` — applyState/getState round-trip; reset; sameAsWave1 coupling both directions; sum forced off when a wave disabled; speed multiplier.
- `tests/LabPresets.test.ts` — all 20 validate against ranges + spot-check table; QWP/HWP → exactly π/2, π.
- `tests/labQueryParameterMapping.test.ts` — defaults, preset+override precedence, clamping.
- Manual (browser): rendering vs EMANIM side-by-side, orbit/zoom/presets/parallel projection, projector colors, context-loss dialog, ~60 fps with all curves+B, PDOM order.

## Milestones (each ends with `npm run check && npm run lint && npm run build && npm test` green)
- **M0 — Model core**: constants, colors, `src/common/model/*`, all model tests, `controls` string skeleton in 3 locales + StringManager getters. No view changes.
- **M1 — 3D viewport + Intro**: `WaveDisplayNode`, `WaveSceneCamera`, control bundles, `WaveControlNode`/`ViewControlNode`/`WaveTimeControlNode`; Intro complete incl. a11y. First side-by-side visual check vs EMANIM. Early check: 1px `THREE.Line` acceptability (else jsm `Line2`, verified present in three@0.125.2) and bundle size.
- **M2 — Polarization**: two waves + sum + construction lines + κ-only material. Verify against EMANIM presets Linear+linear 1/2, L+R circular, Linear dichroism.
- **M3 — Wave Plates**: n-only material, retardation readout, QWP/HWP buttons, locked basis.
- **M4 — Lab**: full control surface, B-field, presets ComboBox + custom detection; verify all 20 presets visually.
- **M5 — Permalink + polish + docs**: query params + Copy-link; line-thickness upgrade if needed; screen icons; fill `doc/model.md` + `doc/implementation-notes.md`; es/fr review pass; a11y audit.

## Docs
- `doc/model.md`: units table, three-region equations with φₐ/φ_b derivation, polarization component table, how one material abstraction yields polarizer/wave plate/optical activity (Δφ = 2π(n₁−n₂)L/λ); simplifications: EMANIM extinction law vs Beer–Lambert, no Fresnel/interface reflections, B not n-scaled, EMANIM handedness/sign conventions mirrored; credit EMANIM (A. Szilágyi) as model source.
- `doc/implementation-notes.md`: WaveSceneModel composition, mobius integration notes (ThreeIsometricNode pattern, readonly PerspectiveCamera → FOV dolly, render-in-step, DynamicDrawUsage, frustumCulled=false), model/view test seam, preset/query-param state flow, disposal.

## Risks / verify-at-runtime
1. `MobiusScreenView` not barrel-exported — copy its patterns; verify `getGlobal("phet.joist.sim")` at M1 (fallback window dims).
2. 1px line width on ANGLE platforms — M1 check; mitigation jsm `Line2` (single pinned three instance confirmed) or ribbon mesh, budgeted M5.
3. Bundle size: mobius pulls three (~600 kB min); check `npm run build` + Workbox 12 MB limit at M1.
4. ArrowHelper per-frame updates with along-axis arrows on (≤ ~120) — default off outside Intro.
5. Classic vs web preset delta noted (Linear+linear 2: δ=−90° web vs +90° classic) — web values win.
