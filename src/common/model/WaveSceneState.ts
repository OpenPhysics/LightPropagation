/**
 * WaveSceneState.ts
 *
 * The serializable physics state of a wave scene — exactly the field set that
 * presets and permalink query parameters exchange. Display toggles (curve
 * visibility, E-vectors, B-field) and camera state are deliberately not part
 * of it, mirroring EMANIM's presets.
 */

import {
  AMPLITUDE_DEFAULT,
  AMPLITUDE_RANGE,
  EXTINCTION_DEFAULT,
  EXTINCTION_RANGE,
  INDEX_STEP,
  MATERIAL_LENGTH_DEFAULT,
  MATERIAL_LENGTH_RANGE,
  PHASE_DEGREES_DEFAULT,
  PHASE_DEGREES_RANGE,
  REFRACTIVE_INDEX_DEFAULT,
  REFRACTIVE_INDEX_RANGE,
  WAVELENGTH_NUMBER_DEFAULT,
  WAVELENGTH_NUMBER_RANGE,
} from "../../LightPropagationConstants.js";
import type { PolarizationType } from "./PolarizationType.js";

export type WaveState = {
  enabled: boolean;
  polarization: PolarizationType;
  /** Amplitude A, 0–10. */
  amplitude: number;
  /** Integer wavelength number w, 1–8 (ƛ = w/4). */
  wavelengthNumber: number;
  /** Phase difference δ in degrees, −180…180 (wave 2 only in the UI). */
  phaseDegrees: number;
  /** Whether the wave travels toward −x (wave 1 only in the UI). */
  reversed: boolean;
};

export type MaterialState = {
  enabled: boolean;
  /** Integer material length number m, 1–32 (L = m·π/2). */
  lengthNumber: number;
  /** Refractive index seen by wave 1. */
  n1: number;
  /** Extinction coefficient seen by wave 1. */
  kappa1: number;
  /** Refractive index seen by wave 2. */
  n2: number;
  /** Extinction coefficient seen by wave 2. */
  kappa2: number;
  /** When true, wave 2's n/κ are locked to wave 1's. */
  sameAsWave1: boolean;
};

export type WaveSceneState = {
  wave1: WaveState;
  wave2: WaveState;
  material: MaterialState;
  /** Whether the superposition (sum) of the two waves is shown. */
  sumEnabled: boolean;
};

/** EMANIM's defaults: wave 1 vertical and on, wave 2 off, no material, no sum. */
export function defaultWaveSceneState(): WaveSceneState {
  return {
    wave1: {
      enabled: true,
      polarization: "vertical",
      amplitude: AMPLITUDE_DEFAULT,
      wavelengthNumber: WAVELENGTH_NUMBER_DEFAULT,
      phaseDegrees: 0,
      reversed: false,
    },
    wave2: {
      enabled: false,
      polarization: "horizontal",
      amplitude: AMPLITUDE_DEFAULT,
      wavelengthNumber: WAVELENGTH_NUMBER_DEFAULT,
      phaseDegrees: PHASE_DEGREES_DEFAULT,
      reversed: false,
    },
    material: {
      enabled: false,
      lengthNumber: MATERIAL_LENGTH_DEFAULT,
      n1: REFRACTIVE_INDEX_DEFAULT,
      kappa1: EXTINCTION_DEFAULT,
      n2: REFRACTIVE_INDEX_DEFAULT,
      kappa2: EXTINCTION_DEFAULT,
      sameAsWave1: false,
    },
    sumEnabled: false,
  };
}

/** Deep-merges a partial state over the defaults (each wave/material merged fieldwise). */
export function mergeWaveSceneState(partial?: PartialWaveSceneState): WaveSceneState {
  const base = defaultWaveSceneState();
  if (!partial) {
    return base;
  }
  return {
    wave1: { ...base.wave1, ...partial.wave1 },
    wave2: { ...base.wave2, ...partial.wave2 },
    material: { ...base.material, ...partial.material },
    sumEnabled: partial.sumEnabled ?? base.sumEnabled,
  };
}

export type PartialWaveSceneState = {
  wave1?: Partial<WaveState>;
  wave2?: Partial<WaveState>;
  material?: Partial<MaterialState>;
  sumEnabled?: boolean;
};

function clampToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  return min + Math.round((clamped - min) / step) * step;
}

function clampWaveState(wave: WaveState): WaveState {
  return {
    ...wave,
    amplitude: clampToStep(wave.amplitude, AMPLITUDE_RANGE.min, AMPLITUDE_RANGE.max, 1),
    wavelengthNumber: clampToStep(wave.wavelengthNumber, WAVELENGTH_NUMBER_RANGE.min, WAVELENGTH_NUMBER_RANGE.max, 1),
    phaseDegrees: clampToStep(wave.phaseDegrees, PHASE_DEGREES_RANGE.min, PHASE_DEGREES_RANGE.max, 10),
  };
}

function clampIndex(value: number): number {
  // Round to 2 decimals afterwards so 0.05-step arithmetic can't leave float drift.
  return Math.round(clampToStep(value, REFRACTIVE_INDEX_RANGE.min, REFRACTIVE_INDEX_RANGE.max, INDEX_STEP) * 100) / 100;
}

function clampExtinction(value: number): number {
  return Math.round(clampToStep(value, EXTINCTION_RANGE.min, EXTINCTION_RANGE.max, INDEX_STEP) * 100) / 100;
}

/**
 * Returns a copy of `state` with every numeric field clamped to its slider
 * range and snapped to the slider step (ints for w/m, 0.05 for n/κ, 10° for δ),
 * and the cross-field rules enforced (sum off when a wave is off; wave 2's n/κ
 * locked to wave 1's while sameAsWave1 is set). Used to validate preset tables
 * and permalink query parameters; a clamped state applies losslessly.
 */
export function clampWaveSceneState(state: WaveSceneState): WaveSceneState {
  const n1 = clampIndex(state.material.n1);
  const kappa1 = clampExtinction(state.material.kappa1);
  return {
    wave1: clampWaveState(state.wave1),
    wave2: clampWaveState(state.wave2),
    material: {
      ...state.material,
      lengthNumber: clampToStep(state.material.lengthNumber, MATERIAL_LENGTH_RANGE.min, MATERIAL_LENGTH_RANGE.max, 1),
      n1,
      kappa1,
      // The coupling rule: while sameAsWave1 is set, wave 2's n/κ ARE wave 1's
      // (OpticalMaterial keeps them tracking; a state saying otherwise is invalid).
      n2: state.material.sameAsWave1 ? n1 : clampIndex(state.material.n2),
      kappa2: state.material.sameAsWave1 ? kappa1 : clampExtinction(state.material.kappa2),
    },
    // EMANIM rule: the sum is only meaningful when both waves are on.
    sumEnabled: state.sumEnabled && state.wave1.enabled && state.wave2.enabled,
  };
}

/** Field-by-field equality of two scene states (all fields are primitives). */
export function waveSceneStatesEqual(a: WaveSceneState, b: WaveSceneState): boolean {
  const wavesEqual = (waveA: WaveState, waveB: WaveState): boolean =>
    waveA.enabled === waveB.enabled &&
    waveA.polarization === waveB.polarization &&
    waveA.amplitude === waveB.amplitude &&
    waveA.wavelengthNumber === waveB.wavelengthNumber &&
    waveA.phaseDegrees === waveB.phaseDegrees &&
    waveA.reversed === waveB.reversed;
  return (
    wavesEqual(a.wave1, b.wave1) &&
    wavesEqual(a.wave2, b.wave2) &&
    a.material.enabled === b.material.enabled &&
    a.material.lengthNumber === b.material.lengthNumber &&
    a.material.n1 === b.material.n1 &&
    a.material.kappa1 === b.material.kappa1 &&
    a.material.n2 === b.material.n2 &&
    a.material.kappa2 === b.material.kappa2 &&
    a.material.sameAsWave1 === b.material.sameAsWave1 &&
    a.sumEnabled === b.sumEnabled
  );
}
