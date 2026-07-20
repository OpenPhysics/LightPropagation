/**
 * WaveEquations.test.ts
 *
 * Verifies the EMANIM wave math: vacuum values, phase continuity at the slab
 * interfaces, the decay law, the post-slab retardation φ_b = (n−1)L/ƛ,
 * polarization component conventions, reversed-wave mirroring, and B ⟂ E.
 */

import { describe, expect, it } from "vitest";
import {
  type FieldPair,
  fieldComponents,
  type MaterialSnapshot,
  magneticFromElectric,
  type PhaseDecay,
  phaseAndDecay,
  type WaveSnapshot,
} from "../src/common/model/WaveEquations.js";

const VACUUM: MaterialSnapshot = { enabled: false, halfLength: 0 };

function makeWave(overrides: Partial<WaveSnapshot> = {}): WaveSnapshot {
  return {
    polarization: "vertical",
    amplitude: 5,
    reducedWavelength: 1, // w = 4
    phaseRadians: 0,
    direction: 1,
    refractiveIndex: 1,
    extinction: 0,
    ...overrides,
  };
}

function makeSlab(lengthNumber = 16): MaterialSnapshot {
  // L = m·π/2; default m = 16 gives L = 8π, slab spanning [−4π, +4π].
  return { enabled: true, halfLength: (lengthNumber * Math.PI) / 4 };
}

function evalPhaseDecay(x: number, t: number, wave: WaveSnapshot, material: MaterialSnapshot): PhaseDecay {
  const out: PhaseDecay = { phase: 0, decay: 0 };
  phaseAndDecay(x, t, wave, material, out);
  return out;
}

function evalField(x: number, t: number, wave: WaveSnapshot, material: MaterialSnapshot): FieldPair {
  const out: FieldPair = { y: 0, z: 0 };
  fieldComponents(x, t, wave, material, out);
  return out;
}

describe("phaseAndDecay", () => {
  it("gives the vacuum plane wave Φ = x/ƛ − ωt + δ with D = 1", () => {
    const wave = makeWave({ phaseRadians: 0.3 });
    const { phase, decay } = evalPhaseDecay(2, 1.5, wave, VACUUM);
    expect(phase).toBeCloseTo(2 - 1.5 + 0.3, 12);
    expect(decay).toBe(1);
  });

  it("keeps the phase continuous at both interfaces for assorted n, w and directions", () => {
    const epsilon = 1e-9;
    const slab = makeSlab();
    for (const n of [1.05, 1.5, 2.0]) {
      for (const w of [1, 4, 7]) {
        for (const direction of [1, -1] as const) {
          const wave = makeWave({ refractiveIndex: n, reducedWavelength: w / 4, direction, extinction: 0.4 });
          for (const edge of [-slab.halfLength, slab.halfLength]) {
            // Positions straddling the interface in x (ξ = d·x handles mirroring).
            const before = evalPhaseDecay(direction * (edge - epsilon), 0.7, wave, slab);
            const after = evalPhaseDecay(direction * (edge + epsilon), 0.7, wave, slab);
            expect(after.phase - before.phase).toBeCloseTo(0, 6);
            expect(after.decay - before.decay).toBeCloseTo(0, 6);
          }
        }
      }
    }
  });

  it("decay is 1 before the slab, monotone inside, frozen at exp(−κL/π) after", () => {
    const slab = makeSlab();
    const kappa = 0.25;
    const wave = makeWave({ extinction: kappa });
    const length = 2 * slab.halfLength;

    expect(evalPhaseDecay(-slab.halfLength - 1, 0, wave, slab).decay).toBe(1);

    let previous = 1;
    for (let x = -slab.halfLength + 0.1; x < slab.halfLength; x += 0.5) {
      const { decay } = evalPhaseDecay(x, 0, wave, slab);
      expect(decay).toBeLessThan(previous);
      previous = decay;
    }

    const frozen = Math.exp((-kappa * length) / Math.PI);
    expect(evalPhaseDecay(slab.halfLength + 0.5, 0, wave, slab).decay).toBeCloseTo(frozen, 12);
    expect(evalPhaseDecay(slab.halfLength + 5, 0, wave, slab).decay).toBeCloseTo(frozen, 12);
  });

  it("wavelength-dependent absorption uses ƛ as the decay length instead of π", () => {
    const kappa = 0.3;
    const lambdaBar = 0.5; // w = 2, so ƛ ≠ π: the two laws must differ
    const wave = makeWave({ extinction: kappa, reducedWavelength: lambdaBar });
    const emanimSlab = makeSlab(); // wavelengthDependentAbsorption absent = EMANIM parity
    const beerSlab: MaterialSnapshot = { ...makeSlab(), wavelengthDependentAbsorption: true };
    const x = emanimSlab.halfLength + 1; // past the slab: full-length decay
    const length = 2 * emanimSlab.halfLength;

    expect(evalPhaseDecay(x, 0, wave, emanimSlab).decay).toBeCloseTo(Math.exp((-kappa * length) / Math.PI), 12);
    expect(evalPhaseDecay(x, 0, wave, beerSlab).decay).toBeCloseTo(Math.exp((-kappa * length) / lambdaBar), 12);
    // Shorter-scale ƛ (0.5 < π) means the Beer–Lambert law absorbs more.
    expect(evalPhaseDecay(x, 0, wave, beerSlab).decay).toBeLessThan(evalPhaseDecay(x, 0, wave, emanimSlab).decay);
  });

  it("shifts the post-slab phase by the retardation φ_b = (n−1)L/ƛ", () => {
    const slab = makeSlab();
    const n = 1.5;
    const lambdaBar = 1;
    const wave = makeWave({ refractiveIndex: n });
    const x = slab.halfLength + 2;
    const withSlab = evalPhaseDecay(x, 0.4, wave, slab);
    const inVacuum = evalPhaseDecay(x, 0.4, wave, VACUUM);
    const length = 2 * slab.halfLength;
    expect(withSlab.phase - inVacuum.phase).toBeCloseTo(((n - 1) * length) / lambdaBar, 10);
  });

  it("a reversed wave enters the slab from +x", () => {
    const slab = makeSlab();
    const wave = makeWave({ direction: -1, extinction: 0.5 });
    const entrySide = evalPhaseDecay(slab.halfLength - 0.01, 0, wave, slab);
    const exitSide = evalPhaseDecay(-slab.halfLength + 0.01, 0, wave, slab);
    expect(entrySide.decay).toBeGreaterThan(0.99);
    expect(exitSide.decay).toBeCloseTo(Math.exp((-0.5 * 2 * slab.halfLength) / Math.PI), 2);
  });
});

describe("fieldComponents", () => {
  it("vertical: e_y = A·sinΦ at known (x, t)", () => {
    const wave = makeWave();
    const atCrest = evalField(Math.PI / 2, 0, wave, VACUUM);
    expect(atCrest.y).toBeCloseTo(5, 10);
    expect(atCrest.z).toBe(0);
    const later = evalField(0, Math.PI / 2, wave, VACUUM);
    expect(later.y).toBeCloseTo(-5, 10);
  });

  it("horizontal: e_z = −A·sinΦ (mirrors EMANIM's sign convention)", () => {
    const vertical = evalField(1.2, 0.3, makeWave(), VACUUM);
    const horizontal = evalField(1.2, 0.3, makeWave({ polarization: "horizontal" }), VACUUM);
    expect(horizontal.z).toBeCloseTo(-vertical.y, 10);
    expect(horizontal.y).toBe(0);
  });

  it("circular components are 90° apart with constant magnitude", () => {
    const left = makeWave({ polarization: "leftCircular" });
    const right = makeWave({ polarization: "rightCircular" });
    for (const x of [0, 0.7, 2.9]) {
      const l = evalField(x, 0.4, left, VACUUM);
      const r = evalField(x, 0.4, right, VACUUM);
      const phase = x - 0.4;
      // e_z = A·sinΦ for both; e_y = A·sin(Φ ∓ π/2) = ∓A·cosΦ.
      expect(l.z).toBeCloseTo(5 * Math.sin(phase), 10);
      expect(l.y).toBeCloseTo(-5 * Math.cos(phase), 10);
      expect(r.y).toBeCloseTo(5 * Math.cos(phase), 10);
      expect(Math.hypot(l.y, l.z)).toBeCloseTo(5, 10);
      expect(Math.hypot(r.y, r.z)).toBeCloseTo(5, 10);
    }
  });
});

describe("magneticFromElectric", () => {
  it("B is perpendicular to E for every polarization", () => {
    const b: FieldPair = { y: 0, z: 0 };
    for (const polarization of ["vertical", "horizontal", "leftCircular", "rightCircular"] as const) {
      for (const direction of [1, -1] as const) {
        const e = evalField(1.1, 0.6, makeWave({ polarization, direction }), VACUUM);
        magneticFromElectric(e.y, e.z, direction, b);
        expect(e.y * b.y + e.z * b.z).toBeCloseTo(0, 12);
      }
    }
  });

  it("B = d·(0, −e_z, e_y) and flips sign when the wave reverses", () => {
    const b: FieldPair = { y: 0, z: 0 };
    magneticFromElectric(2, 3, 1, b);
    expect(b.y).toBe(-3);
    expect(b.z).toBe(2);
    magneticFromElectric(2, 3, -1, b);
    expect(b.y).toBe(3);
    expect(b.z).toBe(-2);
  });
});
