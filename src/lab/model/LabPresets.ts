/**
 * LabPresets.ts
 *
 * EMANIM's 20 preset phenomena as partial wave-scene states over the shared
 * defaults (A = 5, w = 4, δ = 0, m = 16, n = 1, κ = 0). Quirks preserved on
 * purpose for parity with the EMANIM web app:
 *   - "Horizontal" uses wave 2 (so a horizontal wave keeps wave 2's color),
 *     and "Right circular" likewise.
 *   - "Linear + linear 2" uses δ = −90° (the web app's value; classic EMANIM
 *     used +90°).
 */

import {
  clampWaveSceneState,
  mergeWaveSceneState,
  type PartialWaveSceneState,
  type WaveSceneState,
} from "../../common/model/WaveSceneState.js";

export const LabPresetCategories = [
  "singleWaves",
  "superposition",
  "interference",
  "material",
  "linearAnisotropy",
  "circularAnisotropy",
] as const;
export type LabPresetCategory = (typeof LabPresetCategories)[number];

export const LabPresetKeys = [
  "vertical",
  "horizontal",
  "leftCircular",
  "rightCircular",
  "linearPlusLinear1",
  "linearPlusLinear2",
  "leftPlusRightCircular",
  "wavelengthRatio1to1",
  "wavelengthRatio1to8",
  "wavelengthRatio7to8",
  "standingWave",
  "absorption",
  "refraction",
  "absorptionRefraction",
  "linearDichroism",
  "linearBirefringence",
  "linearDichroismBirefringence",
  "circularDichroism",
  "circularBirefringence",
  "circularDichroismBirefringence",
] as const;
export type LabPresetKey = (typeof LabPresetKeys)[number];

/** What the Lab's preset selector holds: a preset, or "custom" after any manual edit. */
export type LabPresetSelection = LabPresetKey | "custom";
export const LabPresetSelectionValues = [...LabPresetKeys, "custom"] as const;

export type LabPreset = {
  key: LabPresetKey;
  category: LabPresetCategory;
  state: PartialWaveSceneState;
};

export const LAB_PRESETS: readonly LabPreset[] = [
  // ── Single waves ────────────────────────────────────────────────────────────
  { key: "vertical", category: "singleWaves", state: {} },
  {
    key: "horizontal",
    category: "singleWaves",
    state: { wave1: { enabled: false }, wave2: { enabled: true, polarization: "horizontal" } },
  },
  { key: "leftCircular", category: "singleWaves", state: { wave1: { polarization: "leftCircular" } } },
  {
    key: "rightCircular",
    category: "singleWaves",
    state: { wave1: { enabled: false }, wave2: { enabled: true, polarization: "rightCircular" } },
  },
  // ── Superposition ───────────────────────────────────────────────────────────
  {
    key: "linearPlusLinear1",
    category: "superposition",
    state: { wave2: { enabled: true, polarization: "horizontal" }, sumEnabled: true },
  },
  {
    key: "linearPlusLinear2",
    category: "superposition",
    state: { wave2: { enabled: true, polarization: "horizontal", phaseDegrees: -90 }, sumEnabled: true },
  },
  {
    key: "leftPlusRightCircular",
    category: "superposition",
    state: {
      wave1: { polarization: "leftCircular" },
      wave2: { enabled: true, polarization: "rightCircular", phaseDegrees: 90 },
      sumEnabled: true,
    },
  },
  // ── Interference ────────────────────────────────────────────────────────────
  {
    key: "wavelengthRatio1to1",
    category: "interference",
    state: { wave2: { enabled: true, polarization: "vertical" }, sumEnabled: true },
  },
  {
    key: "wavelengthRatio1to8",
    category: "interference",
    state: {
      wave1: { wavelengthNumber: 1 },
      wave2: { enabled: true, polarization: "vertical", wavelengthNumber: 8 },
      sumEnabled: true,
    },
  },
  {
    key: "wavelengthRatio7to8",
    category: "interference",
    state: {
      wave1: { wavelengthNumber: 7 },
      wave2: { enabled: true, polarization: "vertical", wavelengthNumber: 8 },
      sumEnabled: true,
    },
  },
  {
    key: "standingWave",
    category: "interference",
    state: { wave1: { reversed: true }, wave2: { enabled: true, polarization: "vertical" }, sumEnabled: true },
  },
  // ── Material ────────────────────────────────────────────────────────────────
  { key: "absorption", category: "material", state: { material: { enabled: true, kappa1: 0.25 } } },
  { key: "refraction", category: "material", state: { material: { enabled: true, n1: 1.5 } } },
  {
    key: "absorptionRefraction",
    category: "material",
    state: { material: { enabled: true, n1: 1.5, kappa1: 0.25 } },
  },
  // ── Linear anisotropy ───────────────────────────────────────────────────────
  {
    key: "linearDichroism",
    category: "linearAnisotropy",
    state: {
      wave2: { enabled: true, polarization: "horizontal" },
      sumEnabled: true,
      material: { enabled: true, kappa1: 0.15 },
    },
  },
  {
    key: "linearBirefringence",
    category: "linearAnisotropy",
    state: {
      wave2: { enabled: true, polarization: "horizontal" },
      sumEnabled: true,
      material: { enabled: true, n1: 1.05 },
    },
  },
  {
    key: "linearDichroismBirefringence",
    category: "linearAnisotropy",
    state: {
      wave2: { enabled: true, polarization: "horizontal" },
      sumEnabled: true,
      material: { enabled: true, n1: 1.05, kappa1: 0.15 },
    },
  },
  // ── Circular anisotropy ─────────────────────────────────────────────────────
  {
    key: "circularDichroism",
    category: "circularAnisotropy",
    state: {
      wave1: { polarization: "leftCircular" },
      wave2: { enabled: true, polarization: "rightCircular" },
      sumEnabled: true,
      material: { enabled: true, kappa1: 0.15 },
    },
  },
  {
    key: "circularBirefringence",
    category: "circularAnisotropy",
    state: {
      wave1: { polarization: "leftCircular" },
      wave2: { enabled: true, polarization: "rightCircular" },
      sumEnabled: true,
      material: { enabled: true, n1: 1.05 },
    },
  },
  {
    key: "circularDichroismBirefringence",
    category: "circularAnisotropy",
    state: {
      wave1: { polarization: "leftCircular" },
      wave2: { enabled: true, polarization: "rightCircular" },
      sumEnabled: true,
      material: { enabled: true, n1: 1.05, kappa1: 0.15 },
    },
  },
];

const presetsByKey = new Map<LabPresetKey, LabPreset>(LAB_PRESETS.map((preset) => [preset.key, preset]));

/** The full, validated scene state for a preset (partial state over the defaults). */
export function getLabPresetState(key: LabPresetKey): WaveSceneState {
  const preset = presetsByKey.get(key);
  if (!preset) {
    throw new Error(`Unknown Lab preset: ${key}`);
  }
  return clampWaveSceneState(mergeWaveSceneState(preset.state));
}
