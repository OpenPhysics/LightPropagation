/**
 * FieldSampler.test.ts
 *
 * Verifies the per-frame sampling buffers: shapes, componentwise sum, and the
 * standing-wave pattern (wave 1 reversed + wave 2 forward, equal λ).
 */

import { describe, expect, it } from "vitest";
import { FieldSampler, type SampledWave } from "../src/common/model/FieldSampler.js";
import type { MaterialSnapshot } from "../src/common/model/WaveEquations.js";
import { WAVE_AXIS_HALF_LENGTH, WAVE_SAMPLE_COUNT } from "../src/LightPropagationConstants.js";

const VACUUM: MaterialSnapshot = { enabled: false, halfLength: 0 };

function makeWave(overrides: Partial<SampledWave> = {}): SampledWave {
  return {
    enabled: true,
    polarization: "vertical",
    amplitude: 5,
    reducedWavelength: 1,
    phaseRadians: 0,
    direction: 1,
    refractiveIndex: 1,
    extinction: 0,
    ...overrides,
  };
}

describe("FieldSampler", () => {
  it("allocates 289-point interleaved (y, z) buffers over x ∈ [−8π, 8π]", () => {
    const sampler = new FieldSampler();
    expect(sampler.xGrid.length).toBe(WAVE_SAMPLE_COUNT);
    expect(sampler.xGrid[0]).toBeCloseTo(-WAVE_AXIS_HALF_LENGTH, 4);
    expect(sampler.xGrid[WAVE_SAMPLE_COUNT - 1]).toBeCloseTo(WAVE_AXIS_HALF_LENGTH, 4);
    for (const buffer of [
      sampler.wave1Electric,
      sampler.wave2Electric,
      sampler.sumElectric,
      sampler.wave1Magnetic,
      sampler.wave2Magnetic,
      sampler.sumMagnetic,
    ]) {
      expect(buffer.length).toBe(2 * WAVE_SAMPLE_COUNT);
    }
  });

  it("sum buffers are the componentwise sum of the two waves", () => {
    const sampler = new FieldSampler();
    sampler.sample(0.9, makeWave(), makeWave({ polarization: "leftCircular", phaseRadians: 0.5 }), VACUUM);
    for (let k = 0; k < sampler.sumElectric.length; k++) {
      expect(sampler.sumElectric[k]).toBeCloseTo((sampler.wave1Electric[k] ?? 0) + (sampler.wave2Electric[k] ?? 0), 5);
      expect(sampler.sumMagnetic[k]).toBeCloseTo((sampler.wave1Magnetic[k] ?? 0) + (sampler.wave2Magnetic[k] ?? 0), 5);
    }
  });

  it("a disabled wave samples to zero and drops out of the sum", () => {
    const sampler = new FieldSampler();
    sampler.sample(0.3, makeWave(), makeWave({ enabled: false }), VACUUM);
    for (let k = 0; k < sampler.sumElectric.length; k++) {
      expect(sampler.wave2Electric[k]).toBe(0);
      expect(sampler.sumElectric[k]).toBe(sampler.wave1Electric[k]);
    }
  });

  it("standing wave has fixed nodes and 2A antinodes", () => {
    const sampler = new FieldSampler();
    const reversed = makeWave({ direction: -1 });
    const forward = makeWave();

    // Sum e_y = A[sin(−x−t) + sin(x−t)] = −2A·cos(x)·sin(t).
    // Node at x = π/2 (grid index 153), antinode at x = 0 (grid index 144).
    const nodeIndex = 153;
    const antinodeIndex = 144;
    expect(sampler.xGrid[nodeIndex]).toBeCloseTo(Math.PI / 2, 4);
    expect(sampler.xGrid[antinodeIndex]).toBeCloseTo(0, 4);

    let largestAtAntinode = 0;
    for (const t of [0, 0.4, 0.9, Math.PI / 2, 2.2, 3.0]) {
      sampler.sample(t, reversed, forward, VACUUM);
      expect(sampler.sumElectric[2 * nodeIndex]).toBeCloseTo(0, 3);
      const valueAtAntinode = Math.abs(sampler.sumElectric[2 * antinodeIndex] ?? 0);
      expect(valueAtAntinode).toBeCloseTo(2 * 5 * Math.abs(Math.sin(t)), 3);
      largestAtAntinode = Math.max(largestAtAntinode, valueAtAntinode);
    }
    expect(largestAtAntinode).toBeCloseTo(10, 3);
  });
});
