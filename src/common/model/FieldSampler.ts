/**
 * FieldSampler.ts
 *
 * Owns the static 289-point x-grid and the preallocated Float32Array buffers
 * that hold the sampled electric and magnetic fields of wave 1, wave 2 and
 * their sum. sample() refills the buffers each frame with zero allocation;
 * the 3D view copies them straight into three.js BufferAttributes.
 *
 * Buffer layout: interleaved (eY, eZ) pairs, so buffer[2i] is the y (vertical)
 * component and buffer[2i + 1] the z component at grid point i.
 */

import { WAVE_AXIS_HALF_LENGTH, WAVE_SAMPLE_COUNT, WAVE_SAMPLE_STEP } from "../../LightPropagationConstants.js";
import {
  type FieldPair,
  fieldComponents,
  type MaterialSnapshot,
  magneticFromElectric,
  type WaveSnapshot,
} from "./WaveEquations.js";

/** A wave snapshot plus its on/off flag (a disabled wave samples to zero). */
export type SampledWave = WaveSnapshot & { enabled: boolean };

export class FieldSampler {
  /** x-coordinate of each grid point, filled once at construction. */
  public readonly xGrid: Float32Array;

  public readonly wave1Electric: Float32Array;
  public readonly wave2Electric: Float32Array;
  public readonly sumElectric: Float32Array;
  public readonly wave1Magnetic: Float32Array;
  public readonly wave2Magnetic: Float32Array;
  public readonly sumMagnetic: Float32Array;

  private readonly scratchE: FieldPair = { y: 0, z: 0 };
  private readonly scratchB: FieldPair = { y: 0, z: 0 };

  public constructor() {
    this.xGrid = new Float32Array(WAVE_SAMPLE_COUNT);
    for (let i = 0; i < WAVE_SAMPLE_COUNT; i++) {
      this.xGrid[i] = -WAVE_AXIS_HALF_LENGTH + i * WAVE_SAMPLE_STEP;
    }
    const pairCount = 2 * WAVE_SAMPLE_COUNT;
    this.wave1Electric = new Float32Array(pairCount);
    this.wave2Electric = new Float32Array(pairCount);
    this.sumElectric = new Float32Array(pairCount);
    this.wave1Magnetic = new Float32Array(pairCount);
    this.wave2Magnetic = new Float32Array(pairCount);
    this.sumMagnetic = new Float32Array(pairCount);
  }

  /**
   * Samples both waves (and their sum) at time t into the buffers.
   * Allocation-free; safe to call every animation frame.
   */
  public sample(t: number, wave1: SampledWave, wave2: SampledWave, material: MaterialSnapshot): void {
    this.sampleWave(t, wave1, material, this.wave1Electric, this.wave1Magnetic);
    this.sampleWave(t, wave2, material, this.wave2Electric, this.wave2Magnetic);
    for (let k = 0; k < this.sumElectric.length; k++) {
      this.sumElectric[k] = (this.wave1Electric[k] ?? 0) + (this.wave2Electric[k] ?? 0);
      this.sumMagnetic[k] = (this.wave1Magnetic[k] ?? 0) + (this.wave2Magnetic[k] ?? 0);
    }
  }

  private sampleWave(
    t: number,
    wave: SampledWave,
    material: MaterialSnapshot,
    electric: Float32Array,
    magnetic: Float32Array,
  ): void {
    if (!wave.enabled) {
      electric.fill(0);
      magnetic.fill(0);
      return;
    }
    for (let i = 0; i < WAVE_SAMPLE_COUNT; i++) {
      const x = -WAVE_AXIS_HALF_LENGTH + i * WAVE_SAMPLE_STEP;
      fieldComponents(x, t, wave, material, this.scratchE);
      magneticFromElectric(this.scratchE.y, this.scratchE.z, wave.direction, this.scratchB);
      electric[2 * i] = this.scratchE.y;
      electric[2 * i + 1] = this.scratchE.z;
      magnetic[2 * i] = this.scratchB.y;
      magnetic[2 * i + 1] = this.scratchB.z;
    }
  }
}
