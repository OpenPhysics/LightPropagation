# CLAUDE.md — Light Propagation

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

A four-screen SceneryStack simulation about light propagating through polarizers and wave
plates, scaffolded from `TemplateSingleSim`. All four screens share electromagnetic-wave
physics via `WaveSceneModel` in `src/common/model/` — each screen model composes a `scene`
with screen-specific initial state and controls.

- **Intro** (`src/intro/`) — single vertical wave; introduces polarization, amplitude, wavelength, and the 3D view
- **Polarization** (`src/polarization/`) — two waves through an optional dichroic polarizing filter
- **Wave Plates** (`src/wave-plates/`) — birefringent slab with retardation readout (quarter- and half-wave presets)
- **Lab** (`src/lab/`) — full control surface with 20 presets and custom exploration

Shared code keeps the `LightPropagation` prefix; per-screen code uses the
`Intro` / `Polarization` / `WavePlates` / `Lab` prefixes. Concept-named folders, no `-screen` suffix.

## Key files

| File | Purpose |
|---|---|
| `src/LightPropagationColors.ts` | All `ProfileColorProperty` instances (default + projector) |
| `src/LightPropagationConstants.ts` | Named numeric constants (layout px, physics SI units) |
| `src/LightPropagationNamespace.ts` | Namespace used by `.register()` |
| `src/common/LightPropagationPanel.ts` | Pre-themed `Panel` wrapper (uses `LightPropagationColors`) |
| `src/common/LightPropagationButtonOptions.ts` | Flat button-appearance option bundles + light-control-surface combo-box options |
| `src/common/TimeModel.ts` | Composable play/pause + elapsed-time model for animated sims |
| `src/common/model/WaveSceneModel.ts` | Shared EM-wave physics core composed by every screen model |
| `src/i18n/StringManager.ts` | Singleton localized string accessor; per-screen name + a11y getters |
| `src/main.ts` | Entry point; registers all four screens with the Sim |
| `src/intro/IntroScreen.ts` | `Screen<IntroModel, IntroScreenView>` wrapper |
| `src/polarization/PolarizationScreen.ts` | `Screen<PolarizationModel, PolarizationScreenView>` wrapper |
| `src/wave-plates/WavePlatesScreen.ts` | `Screen<WavePlatesModel, WavePlatesScreenView>` wrapper |
| `src/lab/LabScreen.ts` | `Screen<LabModel, LabScreenView>` wrapper |
| `src/preferences/lightPropagationQueryParameters.ts` | `QueryStringMachine` parameters |

## Screens

Four screens registered in `src/main.ts`, in this order:

1. **Intro** (`src/intro/`)
2. **Polarization** (`src/polarization/`)
3. **Wave Plates** (`src/wave-plates/`)
4. **Lab** (`src/lab/`)

When implementing: put shared physics in `src/common/`, per-screen state in each
`*Model.ts`. Per-screen a11y lives under `a11y.<screenKey>` (`intro` / `polarization` /
`wavePlates` / `lab`) in each locale JSON, exposed via `StringManager.getIntroA11yStrings()` /
`getPolarizationA11yStrings()` / `getWavePlatesA11yStrings()` / `getLabA11yStrings()`. Make each
`currentDetailsContent` a live `DerivedProperty` over model state and add `accessibleName`s to
every interactive node. Full convention and checklist: [../Baton/ACCESSIBILITY.md](../Baton/ACCESSIBILITY.md).

## Common components

### LightPropagationPanel

Every control panel and info box in the sim should use `LightPropagationPanel` so that
default/projector color switching is automatic:

```typescript
import { LightPropagationPanel } from "../../common/LightPropagationPanel.js";
const panel = new LightPropagationPanel(content);              // uses LightPropagationColors defaults
const panel = new LightPropagationPanel(content, { xMargin: 20 }); // override any PanelOption
```

### TimeModel

For screens with animation, compose `TimeModel` into the screen model:

```typescript
import { TimeModel } from "../../common/TimeModel.js";

export class WavePlatesModel implements TModel {
  public readonly timer = new TimeModel();   // starts paused; pass true to auto-play

  public step(dt: number): void {
    this.timer.step(dt);
    // use this.timer.timeProperty.value for physics
  }
  public reset(): void { this.timer.reset(); /* … */ }
}
```

Wire the view to `TimeControlNode` from `scenerystack/scenery-phet` binding on
`model.timer.isPlayingProperty`.

### LightPropagationButtonOptions

SceneryStack's push/round buttons default to a 3-D/beveled look; every button in the sim
should be flat instead. Spread these into the relevant options object:

```typescript
import { FLAT_RESET_ALL_BUTTON_OPTIONS, FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../common/LightPropagationButtonOptions.js";

const resetAllButton = new ResetAllButton({ ...FLAT_RESET_ALL_BUTTON_OPTIONS, listener: () => {...} });
const exampleButton = new RectangularPushButton({ ...FLAT_RECTANGULAR_BUTTON_OPTIONS, content, listener });
```

`FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS` spreads into `TimeControlNode`'s `playPauseStepButtonOptions`;
`TIME_CONTROL_SPEED_RADIO_OPTIONS` fixes `TimeControlNode`'s speed-radio label color, which
otherwise defaults to black text on the sim's dark default-mode panels. `SIM_COMBO_BOX_OPTIONS`
themes a `ComboBox`'s button/list chrome to the light control surface below; pair item labels
with `LIGHT_SURFACE_TEXT_FILL` (not `LightPropagationColors.textColorProperty`, which is for panel-fill text).

## Accessibility

Each screen ships with the three required layers wired up: PDOM names, a `*ScreenSummaryContent`,
and an explicit `pdomOrder` + `*KeyboardHelpContent`. A11y strings live under the `a11y.<screenKey>`
key in each locale JSON, exposed via the per-screen `StringManager` getters above.

## npm scripts

`start`/`dev` (vite) · `build` · `build:single` · `check` (tsc) · `lint`/`fix` (biome) ·
`test` (vitest) · `icons` · `rename`. Gate: `npm run check && npm run lint && npm run build && npm test`.

## PWA

After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
