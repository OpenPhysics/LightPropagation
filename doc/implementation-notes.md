# Implementation Notes - Light Propagation

## Architecture Overview

Light Propagation is a four-screen SceneryStack simulation of light passing through polarizers
and wave plates. Each screen is currently a scaffold — model/view separation, color profiles,
localization, and reset behavior are wired up, but the physics is not yet implemented.

### High-Level Architecture

```
main.ts
  ├─ IntroScreen         (Screen<IntroModel, IntroScreenView>)
  │    ├─ IntroModel                    state + logic  (src/intro/model/)
  │    └─ IntroScreenView               visuals        (src/intro/view/)
  ├─ PolarizationScreen  (Screen<PolarizationModel, PolarizationScreenView>)
  │    ├─ PolarizationModel             state + logic  (src/polarization/model/)
  │    └─ PolarizationScreenView        visuals        (src/polarization/view/)
  ├─ WavePlatesScreen    (Screen<WavePlatesModel, WavePlatesScreenView>)
  │    ├─ WavePlatesModel               state + logic  (src/wave-plates/model/)
  │    └─ WavePlatesScreenView          visuals        (src/wave-plates/view/)
  └─ LabScreen           (Screen<LabModel, LabScreenView>)
       ├─ LabModel                      state + logic  (src/lab/model/)
       └─ LabScreenView                 visuals        (src/lab/view/)

src/common/
  ├─ LightPropagationPanel.ts   pre-themed panel (all screens share LightPropagationColors)
  └─ TimeModel.ts               composable play/pause + elapsed time

src/preferences/
  ├─ LightPropagationPreferencesModel   sim-specific pref state
  ├─ LightPropagationPreferencesNode    pref UI shown in Preferences → Simulation
  └─ lightPropagationQueryParameters    query-parameter declarations
```

Each screen is currently self-contained (no shared root model) — see
`doc/multi-screen.md` for how to introduce a shared model if the screens end up
needing common state (e.g. wavelength, light source parameters).

Data flows Model → View through AXON `Property` objects. The view observes
properties via `.link()` or `.lazyLink()` and updates reactively.

## Model Components

### IntroModel / PolarizationModel / WavePlatesModel / LabModel

Each is an empty coordinator with documented hooks for `step(dt)` and `reset()`.
Add physics state as `BooleanProperty`, `NumberProperty`, etc. from
`scenerystack/axon`.

### TimeModel (common)

`src/common/TimeModel.ts` is a reusable play/pause + elapsed-time model for
animated sims. Compose it into a screen model rather than subclassing:

```typescript
export class YourModel implements TModel {
  public readonly timer = new TimeModel();

  public step(dt: number): void {
    this.timer.step(dt);
    // physics driven by this.timer.timeProperty.value
  }
  public reset(): void { this.timer.reset(); }
}
```

## View Components

### Per-screen ScreenView as Coordinator

Each `*ScreenView` demonstrates layout using `layoutBounds`, background fill from
`LightPropagationColors.ts`, and a `ResetAllButton` wired to `model.reset()`. Add
specialized sub-nodes under the screen's own `view/` folder.

### LightPropagationPanel (common)

`src/common/LightPropagationPanel.ts` wraps SceneryStack's `Panel` with the sim's color
scheme baked in. All control panels should use `LightPropagationPanel` so projector-mode
switching is automatic:

```typescript
const panel = new LightPropagationPanel(content);            // defaults
const panel = new LightPropagationPanel(content, { xMargin: 20 }); // any PanelOption override
```

### Color Scheme

`LightPropagationColors.ts` defines `ProfileColorProperty` instances for "default" (dark)
and "projector" (light) profiles. SceneryStack switches profiles automatically
when the user toggles Projector Mode in Preferences.

## Multi-screen wiring

See `doc/multi-screen.md` for the general guide this sim followed. Specifics for
this sim:
- Screen keys in locale JSON: `intro`, `polarization`, `wavePlates`, `lab`
- `StringManager.getScreenNames()` exposes all four name properties
- `StringManager` exposes `getIntroA11yStrings()` / `getPolarizationA11yStrings()` /
  `getWavePlatesA11yStrings()` / `getLabA11yStrings()`
- All four screens are registered in `src/main.ts`

## Known gaps / TODOs

- No physics yet — each screen is a placeholder label + Reset All button.
- No home-screen icons yet — screens use the SceneryStack default `ScreenIcon`.
- No dispose() calls yet — add them once Properties gain external listeners.
- Each `*Model.step()` and `reset()` body is a stub — fill in with real physics.
- Each `*ScreenView` pdomOrder TODO comment — add interactive nodes as they are created.
