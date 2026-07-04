/**
 * LabPresets.test.ts
 *
 * The 20 Lab presets: every entry validates against the slider ranges
 * (clamping must be a no-op), spot-checks against the EMANIM preset table,
 * and the Wave Plates QWP/HWP button values produce exactly π/2 and π of
 * retardation at the locked w = 4.
 */

import { describe, expect, it } from "vitest";
import { clampWaveSceneState, mergeWaveSceneState } from "../src/common/model/WaveSceneState.js";
import { MATERIAL_UNIT_LENGTH } from "../src/LightPropagationConstants.js";
import { getLabPresetState, LAB_PRESETS, LabPresetKeys } from "../src/lab/model/LabPresets.js";
import { HALF_WAVE_PLATE, QUARTER_WAVE_PLATE } from "../src/wave-plates/model/WavePlatesModel.js";

describe("LabPresets", () => {
  it("defines all 20 presets, one per key, in key order", () => {
    expect(LAB_PRESETS).toHaveLength(20);
    expect(LAB_PRESETS.map((preset) => preset.key)).toEqual([...LabPresetKeys]);
  });

  it("every preset is already on-grid: clamping its merged state is a no-op", () => {
    for (const preset of LAB_PRESETS) {
      const merged = mergeWaveSceneState(preset.state);
      expect(clampWaveSceneState(merged), preset.key).toEqual(merged);
    }
  });

  it("single-wave and material presets never enable the sum", () => {
    for (const key of [
      "vertical",
      "horizontal",
      "leftCircular",
      "rightCircular",
      "absorption",
      "refraction",
      "absorptionRefraction",
    ] as const) {
      expect(getLabPresetState(key).sumEnabled, key).toBe(false);
    }
  });

  it("Horizontal keeps EMANIM's quirk: the wave lives on wave 2", () => {
    const state = getLabPresetState("horizontal");
    expect(state.wave1.enabled).toBe(false);
    expect(state.wave2.enabled).toBe(true);
    expect(state.wave2.polarization).toBe("horizontal");
  });

  it("Linear + linear 2 uses the web app's δ = −90°", () => {
    expect(getLabPresetState("linearPlusLinear2").wave2.phaseDegrees).toBe(-90);
  });

  it("Left + right circular uses δ = +90°", () => {
    expect(getLabPresetState("leftPlusRightCircular").wave2.phaseDegrees).toBe(90);
  });

  it("wavelength-ratio presets set (w1, w2) = (4,4), (1,8), (7,8)", () => {
    const pairs: Array<[Parameters<typeof getLabPresetState>[0], number, number]> = [
      ["wavelengthRatio1to1", 4, 4],
      ["wavelengthRatio1to8", 1, 8],
      ["wavelengthRatio7to8", 7, 8],
    ];
    for (const [key, w1, w2] of pairs) {
      const state = getLabPresetState(key);
      expect(state.wave1.wavelengthNumber, key).toBe(w1);
      expect(state.wave2.wavelengthNumber, key).toBe(w2);
      expect(state.sumEnabled, key).toBe(true);
    }
  });

  it("Standing wave reverses wave 1 only", () => {
    const state = getLabPresetState("standingWave");
    expect(state.wave1.reversed).toBe(true);
    expect(state.wave2.reversed).toBe(false);
    expect(state.wave1.wavelengthNumber).toBe(state.wave2.wavelengthNumber);
    expect(state.sumEnabled).toBe(true);
  });

  it("anisotropy presets act on wave 1 only (κ₂ = 0, n₂ = 1)", () => {
    for (const key of [
      "linearDichroism",
      "linearBirefringence",
      "linearDichroismBirefringence",
      "circularDichroism",
      "circularBirefringence",
      "circularDichroismBirefringence",
    ] as const) {
      const state = getLabPresetState(key);
      expect(state.material.enabled, key).toBe(true);
      expect(state.material.n2, key).toBe(1);
      expect(state.material.kappa2, key).toBe(0);
      expect(state.sumEnabled, key).toBe(true);
    }
    expect(getLabPresetState("linearDichroism").material.kappa1).toBe(0.15);
    expect(getLabPresetState("linearBirefringence").material.n1).toBe(1.05);
    expect(getLabPresetState("circularBirefringence").wave1.polarization).toBe("leftCircular");
    expect(getLabPresetState("circularBirefringence").wave2.polarization).toBe("rightCircular");
  });

  it("QWP and HWP button values give retardation of exactly π/2 and π at w = 4", () => {
    // Δφ = (n₁ − n₂)·L/ƛ with L = m·π/2 and ƛ = w/4 = 1.
    const retardation = (plate: { lengthNumber: number; n1: number; n2: number }): number =>
      (plate.n1 - plate.n2) * plate.lengthNumber * MATERIAL_UNIT_LENGTH;
    expect(retardation(QUARTER_WAVE_PLATE)).toBeCloseTo(Math.PI / 2, 12);
    expect(retardation(HALF_WAVE_PLATE)).toBeCloseTo(Math.PI, 12);
  });
});
