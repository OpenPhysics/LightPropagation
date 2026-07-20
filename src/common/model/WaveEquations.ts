/**
 * WaveEquations.ts
 *
 * Pure, allocation-free wave math ported verbatim from EMANIM
 * (https://emanim.szialab.org, A. Szilágyi). No axon, no three.js — this is
 * the unit-testable core that everything else consumes.
 *
 * Units are EMANIM's dimensionless axis units with c = 1:
 *   - reduced wavelength ƛ = w/4 (w = integer wavelength number 1–8)
 *   - angular frequency ω = 1/ƛ
 *   - direction sign d = −1 when the wave travels toward −x ("reversed")
 *   - propagation coordinate ξ = d·x, so slab comparisons on ξ automatically
 *     mirror for reversed waves (a reversed wave enters the slab at x = +L/2).
 *
 * A material slab of length L is centered at the origin: ξ_in = −L/2,
 * ξ_out = +L/2. Phase Φ and amplitude decay D per region:
 *   - before / no material (ξ < ξ_in):     Φ = ξ/ƛ − ωt + δ            D = 1
 *   - inside (ξ_in ≤ ξ < ξ_out):           Φ = n·ξ/ƛ − ωt + δ + φₐ     D = exp(−κ(ξ−ξ_in)/π)
 *                                          φₐ = ξ_in(1−n)/ƛ
 *   - after (ξ ≥ ξ_out):                   Φ = ξ/ƛ − ωt + δ + φ_b      D = exp(−κL/π)
 *                                          φ_b = (n−1)L/ƛ   (the retardation)
 * φₐ and φ_b make Φ continuous at both interfaces.
 *
 * The decay law D = exp(−κ·Δx/π) is EMANIM's (wavelength-independent) form,
 * kept for exact parity. When the material's wavelengthDependentAbsorption
 * flag is set (the Preferences → Simulation toggle), the fixed length scale π
 * is replaced by ƛ, giving the physical Beer–Lambert form D = exp(−κ·Δx/ƛ)
 * where shorter wavelengths absorb more strongly; see doc/model.md.
 *
 * Transverse components use the EMANIM web app's sign conventions verbatim
 * (documented, not "fixed"): y is vertical, z is the other transverse axis.
 */

import type { PolarizationType } from "./PolarizationType.js";

/** Everything needed to evaluate one wave's field at (x, t). */
export type WaveSnapshot = {
  polarization: PolarizationType;
  /** Field amplitude A (arbitrary units, 0–10). */
  amplitude: number;
  /** Reduced wavelength ƛ = w/4. */
  reducedWavelength: number;
  /** Phase offset δ in radians (wave 2's "phase difference"). */
  phaseRadians: number;
  /** Direction sign d: +1 toward +x, −1 toward −x. */
  direction: 1 | -1;
  /** Refractive index n this wave sees inside the slab. */
  refractiveIndex: number;
  /** Extinction coefficient κ this wave sees inside the slab. */
  extinction: number;
};

/** The material slab, shared by both waves (per-wave n/κ live on the wave). */
export type MaterialSnapshot = {
  enabled: boolean;
  /** Half the slab length, L/2, in axis units. Slab spans ξ ∈ [−L/2, +L/2]. */
  halfLength: number;
  /**
   * When true, decay uses the physical Beer–Lambert length scale ƛ instead of
   * EMANIM's fixed π (absent/false = EMANIM parity, the default).
   */
  wavelengthDependentAbsorption?: boolean;
};

/** Reusable output record for {@link phaseAndDecay}. */
export type PhaseDecay = {
  phase: number;
  decay: number;
};

/** Reusable output record for a transverse (y, z) field pair. */
export type FieldPair = {
  y: number;
  z: number;
};

const HALF_PI = Math.PI / 2;

/**
 * Computes the phase Φ and amplitude decay D of a wave at position x, time t.
 * Writes into `out` to keep the per-frame sampling loop allocation-free.
 */
export function phaseAndDecay(
  x: number,
  t: number,
  wave: WaveSnapshot,
  material: MaterialSnapshot,
  out: PhaseDecay,
): void {
  const lambdaBar = wave.reducedWavelength;
  const omega = 1 / lambdaBar;
  const xi = wave.direction * x;
  const vacuumPhase = xi / lambdaBar - omega * t + wave.phaseRadians;

  if (!material.enabled || material.halfLength <= 0) {
    out.phase = vacuumPhase;
    out.decay = 1;
    return;
  }

  const xiIn = -material.halfLength;
  const xiOut = material.halfLength;
  const n = wave.refractiveIndex;
  const kappa = wave.extinction;
  const length = 2 * material.halfLength;
  const decayLength = material.wavelengthDependentAbsorption ? lambdaBar : Math.PI;

  if (xi < xiIn) {
    out.phase = vacuumPhase;
    out.decay = 1;
  } else if (xi < xiOut) {
    const phiA = (xiIn * (1 - n)) / lambdaBar;
    out.phase = (n * xi) / lambdaBar - omega * t + wave.phaseRadians + phiA;
    out.decay = Math.exp((-kappa * (xi - xiIn)) / decayLength);
  } else {
    const phiB = ((n - 1) * length) / lambdaBar;
    out.phase = vacuumPhase + phiB;
    out.decay = Math.exp((-kappa * length) / decayLength);
  }
}

// Module-level scratch keeps fieldComponents allocation-free (single-threaded).
const scratchPhaseDecay: PhaseDecay = { phase: 0, decay: 0 };

/**
 * Computes the transverse electric-field components (e_y, e_z) of a wave at
 * position x, time t. EMANIM web-app sign conventions:
 *   - vertical:       e_y =  A·D·sin Φ           e_z = 0
 *   - horizontal:     e_y = 0                    e_z = −A·D·sin Φ
 *   - left circular:  e_y =  A·D·sin(Φ − π/2)    e_z =  A·D·sin Φ
 *   - right circular: e_y =  A·D·sin(Φ + π/2)    e_z =  A·D·sin Φ
 */
export function fieldComponents(
  x: number,
  t: number,
  wave: WaveSnapshot,
  material: MaterialSnapshot,
  out: FieldPair,
): void {
  phaseAndDecay(x, t, wave, material, scratchPhaseDecay);
  const scale = wave.amplitude * scratchPhaseDecay.decay;
  const phase = scratchPhaseDecay.phase;

  switch (wave.polarization) {
    case "vertical":
      out.y = scale * Math.sin(phase);
      out.z = 0;
      break;
    case "horizontal":
      out.y = 0;
      out.z = -scale * Math.sin(phase);
      break;
    case "leftCircular":
      out.y = scale * Math.sin(phase - HALF_PI);
      out.z = scale * Math.sin(phase);
      break;
    case "rightCircular":
      out.y = scale * Math.sin(phase + HALF_PI);
      out.z = scale * Math.sin(phase);
      break;
  }
}

/**
 * Computes the magnetic field of a wave from its electric field: B = k̂ × E
 * with k̂ = d·x̂, so B = d·(0, −e_z, e_y). Display-scaled (c = 1); the n-scaling
 * of B inside a medium is deliberately ignored — see doc/model.md.
 */
export function magneticFromElectric(eY: number, eZ: number, direction: 1 | -1, out: FieldPair): void {
  out.y = -direction * eZ;
  out.z = direction * eY;
}
