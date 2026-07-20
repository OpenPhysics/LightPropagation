/**
 * WaveSceneModel.test.ts
 *
 * Verifies the shared screen-model core: state round-trips, reset-to-initial,
 * the sameAsWave1 coupling, the sum-off-when-a-wave-is-off rule, and the
 * time-speed multiplier.
 */

import { BooleanProperty } from "scenerystack/axon";
import { TimeSpeed } from "scenerystack/scenery-phet";
import { describe, expect, it } from "vitest";
import { WaveSceneModel } from "../src/common/model/WaveSceneModel.js";
import type { WaveSceneState } from "../src/common/model/WaveSceneState.js";
import { defaultWaveSceneState } from "../src/common/model/WaveSceneState.js";
import { TIME_SCALE } from "../src/LightPropagationConstants.js";

function linearDichroismState(): WaveSceneState {
  const state = defaultWaveSceneState();
  state.wave1.polarization = "vertical";
  state.wave2 = { ...state.wave2, enabled: true, polarization: "horizontal" };
  state.material = { ...state.material, enabled: true, kappa1: 0.15 };
  state.sumEnabled = true;
  return state;
}

describe("WaveSceneModel", () => {
  it("applyState/getState round-trips", () => {
    const model = new WaveSceneModel();
    const state = linearDichroismState();
    model.applyState(state);
    expect(model.getState()).toEqual(state);
  });

  it("reset() restores the initial state passed to the constructor", () => {
    const initial = {
      wave2: { enabled: true, polarization: "horizontal" as const },
      sumEnabled: true,
    };
    const model = new WaveSceneModel(initial);
    expect(model.wave2.enabledProperty.value).toBe(true);
    expect(model.sumEnabledProperty.value).toBe(true);

    model.wave1.amplitudeProperty.value = 9;
    model.wave2.enabledProperty.value = false; // also forces the sum off
    model.material.enabledProperty.value = true;
    model.timer.timeProperty.value = 4;

    model.reset();
    expect(model.wave1.amplitudeProperty.value).toBe(5);
    expect(model.wave2.enabledProperty.value).toBe(true);
    expect(model.sumEnabledProperty.value).toBe(true);
    expect(model.material.enabledProperty.value).toBe(false);
    expect(model.timer.timeProperty.value).toBe(0);
  });

  it("applying a state with sameAsWave1 set snaps wave 2's n/κ to wave 1's", () => {
    const model = new WaveSceneModel();
    const state = defaultWaveSceneState();
    state.material = {
      ...state.material,
      enabled: true,
      sameAsWave1: true,
      n1: 1.5,
      n2: 1.9,
      kappa1: 0.2,
      kappa2: 0.7,
    };
    model.applyState(state);
    // clampWaveSceneState enforces the coupling, so the divergent n2/kappa2 are dropped…
    expect(model.material.n2Property.value).toBe(1.5);
    expect(model.material.kappa2Property.value).toBe(0.2);
    expect(model.material.sameAsWave1Property.value).toBe(true);
    // …and a second apply of the model's own state is a no-op (idempotent round-trip).
    const roundTripped = model.getState();
    model.applyState(roundTripped);
    expect(model.getState()).toEqual(roundTripped);
  });

  it("sameAsWave1 copies wave 1's n/κ and tracks further wave 1 edits", () => {
    const model = new WaveSceneModel();
    model.material.n1Property.value = 1.5;
    model.material.kappa1Property.value = 0.25;
    model.material.sameAsWave1Property.value = true;
    expect(model.material.n2Property.value).toBe(1.5);
    expect(model.material.kappa2Property.value).toBe(0.25);

    model.material.n1Property.value = 1.8;
    expect(model.material.n2Property.value).toBe(1.8);
  });

  it("a manual wave 2 material edit unchecks sameAsWave1", () => {
    const model = new WaveSceneModel();
    model.material.sameAsWave1Property.value = true;
    model.material.n2Property.value = 1.2;
    expect(model.material.sameAsWave1Property.value).toBe(false);
    expect(model.material.n2Property.value).toBe(1.2);
    // And wave 1 edits no longer propagate.
    model.material.n1Property.value = 1.9;
    expect(model.material.n2Property.value).toBe(1.2);
  });

  it("turning either wave off forces the sum off", () => {
    const model = new WaveSceneModel({ wave2: { enabled: true }, sumEnabled: true });
    expect(model.sumEnabledProperty.value).toBe(true);
    model.wave2.enabledProperty.value = false;
    expect(model.sumEnabledProperty.value).toBe(false);

    model.wave2.enabledProperty.value = true;
    model.sumEnabledProperty.value = true;
    model.wave1.enabledProperty.value = false;
    expect(model.sumEnabledProperty.value).toBe(false);
  });

  it("sumAllowedProperty is true exactly while both waves are on", () => {
    const model = new WaveSceneModel({ wave2: { enabled: true } });
    expect(model.sumAllowedProperty.value).toBe(true);
    model.wave2.enabledProperty.value = false;
    expect(model.sumAllowedProperty.value).toBe(false);
    model.wave2.enabledProperty.value = true;
    model.wave1.enabledProperty.value = false;
    expect(model.sumAllowedProperty.value).toBe(false);
    model.wave1.enabledProperty.value = true;
    expect(model.sumAllowedProperty.value).toBe(true);
  });

  it("step(dt) advances time by dt · speed · TIME_SCALE", () => {
    const model = new WaveSceneModel();
    expect(model.timer.isPlayingProperty.value).toBe(true);

    model.step(1);
    expect(model.timer.timeProperty.value).toBeCloseTo(TIME_SCALE, 10);

    model.timeSpeedProperty.value = TimeSpeed.FAST;
    model.step(1);
    expect(model.timer.timeProperty.value).toBeCloseTo(3 * TIME_SCALE, 10);

    model.timeSpeedProperty.value = TimeSpeed.SLOW;
    model.step(1);
    expect(model.timer.timeProperty.value).toBeCloseTo(3.25 * TIME_SCALE, 10);

    model.timer.isPlayingProperty.value = false;
    model.step(1);
    expect(model.timer.timeProperty.value).toBeCloseTo(3.25 * TIME_SCALE, 10);

    model.stepFrame();
    expect(model.timer.timeProperty.value).toBeCloseTo(3.25 * TIME_SCALE + Math.PI / 18, 10);
  });

  it("keeps the sampler buffers in sync with property changes", () => {
    const model = new WaveSceneModel();
    const before = model.sampler.wave1Electric.slice();
    model.wave1.amplitudeProperty.value = 10;
    model.sampleNow();
    const after = model.sampler.wave1Electric;
    let changed = false;
    for (let k = 0; k < after.length; k++) {
      if (Math.abs((after[k] ?? 0) - (before[k] ?? 0)) > 1e-6) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it("toggling wavelength-dependent absorption resamples the buffers", () => {
    const absorptionPref = new BooleanProperty(false);
    const model = new WaveSceneModel(
      // A slab with κ > 0 and ƛ ≠ π (w = 2) so the two decay laws differ.
      { wave1: { wavelengthNumber: 2 }, material: { enabled: true, kappa1: 0.3 } },
      { wavelengthDependentAbsorptionProperty: absorptionPref },
    );
    const before = model.sampler.wave1Electric.slice();

    absorptionPref.value = true;
    model.step(0); // dt = 0: time does not advance, but the dirty flag forces a resample
    const after = model.sampler.wave1Electric;

    let changed = false;
    for (let k = 0; k < after.length; k++) {
      if (Math.abs((after[k] ?? 0) - (before[k] ?? 0)) > 1e-6) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it("step() while paused still picks up state edits made since the last frame", () => {
    const model = new WaveSceneModel();
    model.timer.isPlayingProperty.value = false;
    model.step(1 / 60); // time does not advance while paused

    const before = model.sampler.wave1Electric.slice();
    model.wave1.amplitudeProperty.value = 10;
    model.step(1 / 60);
    const after = model.sampler.wave1Electric;
    let changed = false;
    for (let k = 0; k < after.length; k++) {
      if (Math.abs((after[k] ?? 0) - (before[k] ?? 0)) > 1e-6) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });
});
