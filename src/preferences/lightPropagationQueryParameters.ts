/**
 * lightPropagationQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. All parameters
 * below are public (intended for end users / sharing links) and set the Lab
 * screen's initial state.
 *
 * Application order: defaults → `preset` → explicit parameters, so e.g.
 * `?preset=absorption&kappa1=0.5` starts from the Absorption preset and then
 * overrides κ₁. Out-of-range numbers are clamped and snapped to the slider
 * grid. The pure mapping lives in src/lab/model/labQueryParameterMapping.ts;
 * this file only declares the parameters and reads which ones were provided.
 *
 * Usage: append e.g. `?preset=standingWave` or
 * `?wave1=leftCircular&wave2=rightCircular&sum=true` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import { PolarizationTypeValues } from "../common/model/PolarizationType.js";
import LightPropagationNamespace from "../LightPropagationNamespace.js";
import { type LabPresetKey, LabPresetKeys } from "../lab/model/LabPresets.js";
import type { LabQueryParameterValues } from "../lab/model/labQueryParameterMapping.js";

/** A wave parameter is a polarization, or "off" to disable the wave. */
const WAVE_VALUES = ["off", ...PolarizationTypeValues];

const lightPropagationQueryParameters = QueryStringMachine.getAll({
  /** Starting Lab preset, e.g. `preset=standingWave`. */
  preset: {
    type: "string",
    defaultValue: "vertical",
    validValues: [...LabPresetKeys],
    public: true,
  },

  /** Wave 1 polarization or "off". */
  wave1: {
    type: "string",
    defaultValue: "vertical",
    validValues: WAVE_VALUES,
    public: true,
  },

  /** Wave 2 polarization or "off". */
  wave2: {
    type: "string",
    defaultValue: "off",
    validValues: WAVE_VALUES,
    public: true,
  },

  /** Wave amplitudes A, 0–10. */
  amplitude1: {
    type: "number",
    defaultValue: 5,
    isValidValue: (value: number) => value >= 0 && value <= 10,
    public: true,
  },
  amplitude2: {
    type: "number",
    defaultValue: 5,
    isValidValue: (value: number) => value >= 0 && value <= 10,
    public: true,
  },

  /** Integer wavelength numbers w, 1–8 (λ = w·π/2). */
  wavelength1: {
    type: "number",
    defaultValue: 4,
    isValidValue: (value: number) => Number.isInteger(value) && value >= 1 && value <= 8,
    public: true,
  },
  wavelength2: {
    type: "number",
    defaultValue: 4,
    isValidValue: (value: number) => Number.isInteger(value) && value >= 1 && value <= 8,
    public: true,
  },

  /** Phase difference δ of wave 2, −180…180 degrees. */
  phase: {
    type: "number",
    defaultValue: 0,
    isValidValue: (value: number) => value >= -180 && value <= 180,
    public: true,
  },

  /** Reverses wave 1's travel direction (toward −x). */
  reverse1: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Shows the superposition of the two waves. */
  sum: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Inserts the material slab. */
  material: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Locks wave 2's n/κ to wave 1's. */
  sameAsWave1: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Integer material length number m, 1–32 (L = m·π/2). */
  materialLength: {
    type: "number",
    defaultValue: 16,
    isValidValue: (value: number) => Number.isInteger(value) && value >= 1 && value <= 32,
    public: true,
  },

  /** Per-wave refractive indices, 1.00–2.00. */
  n1: {
    type: "number",
    defaultValue: 1,
    isValidValue: (value: number) => value >= 1 && value <= 2,
    public: true,
  },
  n2: {
    type: "number",
    defaultValue: 1,
    isValidValue: (value: number) => value >= 1 && value <= 2,
    public: true,
  },

  /** Per-wave extinction coefficients, 0.00–1.00. */
  kappa1: {
    type: "number",
    defaultValue: 0,
    isValidValue: (value: number) => value >= 0 && value <= 1,
    public: true,
  },
  kappa2: {
    type: "number",
    defaultValue: 0,
    isValidValue: (value: number) => value >= 0 && value <= 1,
    public: true,
  },

  /**
   * Uses the physical Beer–Lambert absorption law D = exp(−κ·Δx/ƛ), where
   * shorter wavelengths absorb more strongly, instead of EMANIM's
   * wavelength-independent D = exp(−κ·Δx/π). Also a Preferences →
   * Simulation toggle; this parameter sets its startup value.
   */
  wavelengthDependentAbsorption: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },
});

/**
 * The provided-only view of the parameters (a parameter left at its default
 * because it was absent is undefined here), for stateFromQueryParameters().
 */
export function getLabQueryParameterValues(): LabQueryParameterValues {
  const provided = <T>(key: string, value: T): T | undefined =>
    QueryStringMachine.containsKey(key) ? value : undefined;
  const qp = lightPropagationQueryParameters;
  return {
    preset: provided("preset", qp.preset as LabPresetKey),
    wave1: provided("wave1", qp.wave1 as LabQueryParameterValues["wave1"]),
    wave2: provided("wave2", qp.wave2 as LabQueryParameterValues["wave2"]),
    amplitude1: provided("amplitude1", qp.amplitude1),
    amplitude2: provided("amplitude2", qp.amplitude2),
    wavelength1: provided("wavelength1", qp.wavelength1),
    wavelength2: provided("wavelength2", qp.wavelength2),
    phase: provided("phase", qp.phase),
    reverse1: provided("reverse1", qp.reverse1),
    sum: provided("sum", qp.sum),
    material: provided("material", qp.material),
    sameAsWave1: provided("sameAsWave1", qp.sameAsWave1),
    materialLength: provided("materialLength", qp.materialLength),
    n1: provided("n1", qp.n1),
    n2: provided("n2", qp.n2),
    kappa1: provided("kappa1", qp.kappa1),
    kappa2: provided("kappa2", qp.kappa2),
  };
}

LightPropagationNamespace.register("lightPropagationQueryParameters", lightPropagationQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default lightPropagationQueryParameters;
