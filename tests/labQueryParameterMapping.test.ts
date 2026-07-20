/**
 * labQueryParameterMapping.test.ts
 *
 * The pure permalink mapping: no parameters → defaults with the "vertical"
 * selection; a preset alone keeps its selection; preset + explicit override
 * applies both (override wins) and flips to "custom"; out-of-range values are
 * clamped and snapped to the slider grid; and queryStringFromState() is the
 * inverse, serializing only non-default parameters.
 */

import { describe, expect, it } from "vitest";
import { defaultWaveSceneState } from "../src/common/model/WaveSceneState.js";
import { getLabPresetState } from "../src/lab/model/LabPresets.js";
import {
  permalinkQueryString,
  queryStringFromState,
  stateFromQueryParameters,
} from "../src/lab/model/labQueryParameterMapping.js";

describe("stateFromQueryParameters", () => {
  it("returns the defaults and the vertical selection when nothing is provided", () => {
    const { state, selection } = stateFromQueryParameters({});
    expect(state).toEqual(defaultWaveSceneState());
    expect(selection).toBe("vertical");
  });

  it("a preset alone yields exactly the preset state and keeps its selection", () => {
    const { state, selection } = stateFromQueryParameters({ preset: "standingWave" });
    expect(state).toEqual(getLabPresetState("standingWave"));
    expect(selection).toBe("standingWave");
  });

  it("explicit parameters override the preset and flip the selection to custom", () => {
    const { state, selection } = stateFromQueryParameters({ preset: "absorption", kappa1: 0.5 });
    expect(state.material.enabled).toBe(true); // from the preset
    expect(state.material.kappa1).toBe(0.5); // the override wins
    expect(selection).toBe("custom");
  });

  it("keeps the preset selected when overrides are no-ops", () => {
    // kappa1=0.25 is exactly the Absorption preset's value.
    const { selection } = stateFromQueryParameters({ preset: "absorption", kappa1: 0.25 });
    expect(selection).toBe("absorption");
    // Without a preset, overrides that reproduce the defaults keep "vertical".
    const { selection: verticalSelection } = stateFromQueryParameters({ wave1: "vertical", amplitude1: 5 });
    expect(verticalSelection).toBe("vertical");
  });

  it("locks wave 2's n/κ to wave 1's while sameAsWave1 is set", () => {
    const { state } = stateFromQueryParameters({ sameAsWave1: true, n1: 1.5, n2: 1.9, kappa1: 0.2, kappa2: 0.7 });
    expect(state.material.n2).toBe(1.5);
    expect(state.material.kappa2).toBe(0.2);
  });

  it('wave parameters set enabled and polarization; "off" disables without touching polarization', () => {
    const { state } = stateFromQueryParameters({ wave1: "off", wave2: "leftCircular" });
    expect(state.wave1.enabled).toBe(false);
    expect(state.wave1.polarization).toBe("vertical");
    expect(state.wave2.enabled).toBe(true);
    expect(state.wave2.polarization).toBe("leftCircular");
  });

  it("clamps and snaps out-of-range values to the slider grid", () => {
    const { state } = stateFromQueryParameters({
      amplitude1: 99,
      wavelength2: 0,
      phase: 47,
      n1: 1.234,
      kappa2: -3,
      materialLength: 100,
    });
    expect(state.wave1.amplitude).toBe(10);
    expect(state.wave2.wavelengthNumber).toBe(1);
    expect(state.wave2.phaseDegrees).toBe(50);
    expect(state.material.n1).toBe(1.25);
    expect(state.material.kappa2).toBe(0);
    expect(state.material.lengthNumber).toBe(32);
  });

  it("forces the sum off when either wave is off, even if sum=true is given", () => {
    const { state } = stateFromQueryParameters({ sum: true });
    expect(state.sumEnabled).toBe(false); // wave 2 is off by default
    const both = stateFromQueryParameters({ sum: true, wave2: "horizontal" });
    expect(both.state.sumEnabled).toBe(true);
  });
});

describe("queryStringFromState", () => {
  it("serializes the default state as the empty string", () => {
    expect(queryStringFromState(defaultWaveSceneState())).toBe("");
  });

  it("clamps before serializing: a sum flag left on while a wave is off is dropped", () => {
    // The UI blocks this combination, but the raw model state can hold it;
    // the emitted link must parse back to the same (valid) state.
    const state = defaultWaveSceneState();
    state.sumEnabled = true; // wave 2 is off by default
    expect(queryStringFromState(state)).not.toContain("sum=");
  });

  it("serializes only the non-default parameters", () => {
    const { state } = stateFromQueryParameters({ wave2: "horizontal", sum: true, phase: -90 });
    expect(queryStringFromState(state)).toBe("wave2=horizontal&phase=-90&sum=true");
  });

  it("permalinkQueryString preserves foreign parameters and replaces Lab state ones", () => {
    const { state } = stateFromQueryParameters({ wave2: "horizontal", sum: true });
    const query = permalinkQueryString(
      "?locale=fr&preset=absorption&kappa1=0.5&wavelengthDependentAbsorption=true",
      state,
    );
    const params = new URLSearchParams(query);
    expect(params.get("locale")).toBe("fr"); // foreign parameter untouched
    expect(params.get("wavelengthDependentAbsorption")).toBe("true"); // physics preference untouched
    expect(params.get("preset")).toBeNull(); // stale Lab parameters replaced…
    expect(params.get("kappa1")).toBeNull();
    expect(params.get("wave2")).toBe("horizontal"); // …by the current state
    expect(params.get("sum")).toBe("true");
  });

  it("permalinkQueryString of the default state with no foreign parameters is empty", () => {
    expect(permalinkQueryString("", defaultWaveSceneState())).toBe("");
    expect(permalinkQueryString("?preset=standingWave", defaultWaveSceneState())).toBe("");
  });

  it("round-trips: parsing a serialized state reproduces it", () => {
    for (const preset of ["standingWave", "circularDichroismBirefringence", "wavelengthRatio7to8"] as const) {
      const original = getLabPresetState(preset);
      const query = queryStringFromState(original);
      // Parse the query string back into provided values.
      const values: Record<string, unknown> = {};
      for (const part of query.split("&")) {
        const [key, raw] = part.split("=");
        values[key] = raw === "true" ? true : raw === "false" ? false : Number.isNaN(Number(raw)) ? raw : Number(raw);
      }
      const { state } = stateFromQueryParameters(values);
      expect(state, preset).toEqual(original);
    }
  });
});
