/**
 * LightPropagationConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - The wave model uses EMANIM's dimensionless units (c = 1): distances are
 *    measured along the propagation axis in "axis units" where the sample step
 *    is π/18, and time is measured so that phase = x/ƛ − t/ƛ. They are NOT SI
 *    units; see doc/model.md for the mapping to physical quantities.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in LightPropagationColors.ts, not here.
 */

import { Range, Vector3 } from "scenerystack/dot";
import LightPropagationNamespace from "./LightPropagationNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

// ── Wave domain (EMANIM axis units) ───────────────────────────────────────────

/** Half-length of the propagation axis: x ∈ [−8π, +8π]. */
export const WAVE_AXIS_HALF_LENGTH = 8 * Math.PI;

/** Number of samples along the propagation axis (step π/18 over 16π). */
export const WAVE_SAMPLE_COUNT = 289;

/** Spacing between adjacent samples along the propagation axis. */
export const WAVE_SAMPLE_STEP = (2 * WAVE_AXIS_HALF_LENGTH) / (WAVE_SAMPLE_COUNT - 1);

/**
 * Simulation-time advance per real-time second at normal speed, in axis units.
 * EMANIM advances t by π/18 per frame at 30 fps ⇒ 30·π/18 = 5π/3 ≈ 5.236.
 */
export const TIME_SCALE = (30 * Math.PI) / 18;

// ── Wave controls (slider → model, EMANIM ranges) ─────────────────────────────

/** Electric-field amplitude A (arbitrary units). */
export const AMPLITUDE_RANGE = new Range(0, 10);
export const AMPLITUDE_DEFAULT = 5;
export const AMPLITUDE_STEP = 1;

/**
 * Integer wavelength number w. The reduced wavelength is ƛ = w/4 and the
 * wavelength is λ = w·π/2 = 2π·ƛ, so w = 4 gives ƛ = 1.
 */
export const WAVELENGTH_NUMBER_RANGE = new Range(1, 8);
export const WAVELENGTH_NUMBER_DEFAULT = 4;

/** Axis length corresponding to one unit of the wavelength number: λ = w·π/2. */
export const WAVELENGTH_UNIT = Math.PI / 2;

/** Phase difference δ of wave 2 relative to wave 1, in degrees. */
export const PHASE_DEGREES_RANGE = new Range(-180, 180);
export const PHASE_DEGREES_DEFAULT = 0;
export const PHASE_DEGREES_STEP = 10;

// ── Material (slab) controls ──────────────────────────────────────────────────

/** Integer material length number m. The slab length is L = m·π/2. */
export const MATERIAL_LENGTH_RANGE = new Range(1, 32);
export const MATERIAL_LENGTH_DEFAULT = 16;

/** Axis length corresponding to one unit of the material length number: L = m·π/2. */
export const MATERIAL_UNIT_LENGTH = Math.PI / 2;

/** Refractive index n, per wave. */
export const REFRACTIVE_INDEX_RANGE = new Range(1, 2);
export const REFRACTIVE_INDEX_DEFAULT = 1;

/** Extinction coefficient κ, per wave (EMANIM decay law D = exp(−κ·Δx/π)). */
export const EXTINCTION_RANGE = new Range(0, 1);
export const EXTINCTION_DEFAULT = 0;

/** Slider step shared by the refractive-index and extinction controls. */
export const INDEX_STEP = 0.05;

// ── Scene furniture (axis units) ──────────────────────────────────────────────

/** Half-size of the square transverse frames drawn at each end of the axis. */
export const TRANSVERSE_FRAME_HALF_SIZE = 6;

/** Full transverse extent (y and z) of the material slab wirebox. */
export const MATERIAL_CROSS_SECTION = 12;

// ── Camera ────────────────────────────────────────────────────────────────────

/** Perspective field of view, in degrees (EMANIM uses π/12). */
export const CAMERA_FOV_DEGREES = 15;

/**
 * Near-zero field of view used to emulate a parallel projection with a
 * perspective camera (dolly out, narrow the FOV). EMANIM does the same;
 * mobius's ThreeStage camera is hard-typed as a PerspectiveCamera.
 */
export const CAMERA_PARALLEL_FOV_DEGREES = 0.5;

/** Visible view range (zoom): camera distance = range / tan(fov/2). */
export const CAMERA_RANGE = new Range(6, 60);
export const CAMERA_RANGE_DEFAULT = 20;

/** Forward (look) direction of the default "Nice" camera preset, normalized. */
export const NICE_VIEW_FORWARD = new Vector3(-0.669, -0.223, -0.708).normalized();

LightPropagationNamespace.register("LightPropagationConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  WAVE_AXIS_HALF_LENGTH,
  WAVE_SAMPLE_COUNT,
  WAVE_SAMPLE_STEP,
  TIME_SCALE,
  AMPLITUDE_RANGE,
  AMPLITUDE_DEFAULT,
  AMPLITUDE_STEP,
  WAVELENGTH_NUMBER_RANGE,
  WAVELENGTH_NUMBER_DEFAULT,
  WAVELENGTH_UNIT,
  PHASE_DEGREES_RANGE,
  PHASE_DEGREES_DEFAULT,
  PHASE_DEGREES_STEP,
  MATERIAL_LENGTH_RANGE,
  MATERIAL_LENGTH_DEFAULT,
  MATERIAL_UNIT_LENGTH,
  REFRACTIVE_INDEX_RANGE,
  REFRACTIVE_INDEX_DEFAULT,
  EXTINCTION_RANGE,
  EXTINCTION_DEFAULT,
  INDEX_STEP,
  TRANSVERSE_FRAME_HALF_SIZE,
  MATERIAL_CROSS_SECTION,
  CAMERA_FOV_DEGREES,
  CAMERA_PARALLEL_FOV_DEGREES,
  CAMERA_RANGE,
  CAMERA_RANGE_DEFAULT,
  NICE_VIEW_FORWARD,
});
