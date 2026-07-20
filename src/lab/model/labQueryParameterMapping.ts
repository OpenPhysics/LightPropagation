/**
 * labQueryParameterMapping.ts
 *
 * Pure two-way mapping between the Lab's permalink query parameters and a
 * WaveSceneState — no QueryStringMachine dependency, so it is unit-testable.
 *
 *   - stateFromQueryParameters(): defaults → preset → explicit overrides,
 *     clamped/snapped to the slider grid. Any explicit override makes the
 *     preset selector show "custom".
 *   - queryStringFromState(): the inverse for the "Copy link" button —
 *     clamps the state, then serializes only the parameters that differ from
 *     the defaults, so every emitted link parses back to exactly that state.
 *
 * Known lossy case (intentional): a disabled wave serializes as
 * `waveN=off`, dropping which polarization was selected while it was off —
 * the polarization of an off wave has no physical effect, and the parameter
 * schema (one value per wave) mirrors EMANIM's.
 *
 * The QueryStringMachine declarations live in
 * src/preferences/lightPropagationQueryParameters.ts.
 */

import type { PolarizationType } from "../../common/model/PolarizationType.js";
import {
  clampWaveSceneState,
  defaultWaveSceneState,
  type WaveSceneState,
  type WaveState,
  waveSceneStatesEqual,
} from "../../common/model/WaveSceneState.js";
import { getLabPresetState, type LabPresetKey, type LabPresetSelection } from "./LabPresets.js";

/** A wave query value is a polarization, or "off" to disable the wave. */
export type WaveQueryValue = PolarizationType | "off";

/** Parameters actually present in the URL; absent ones are undefined. */
export type LabQueryParameterValues = {
  preset?: LabPresetKey | undefined;
  wave1?: WaveQueryValue | undefined;
  wave2?: WaveQueryValue | undefined;
  amplitude1?: number | undefined;
  amplitude2?: number | undefined;
  wavelength1?: number | undefined;
  wavelength2?: number | undefined;
  phase?: number | undefined;
  reverse1?: boolean | undefined;
  sum?: boolean | undefined;
  material?: boolean | undefined;
  sameAsWave1?: boolean | undefined;
  materialLength?: number | undefined;
  n1?: number | undefined;
  n2?: number | undefined;
  kappa1?: number | undefined;
  kappa2?: number | undefined;
};

/**
 * Every query-parameter key owned by the Lab permalink mapping. The Record
 * construction makes TypeScript reject a missing or misspelled key, so this
 * list cannot drift from LabQueryParameterValues.
 */
const LAB_QUERY_PARAMETER_KEY_RECORD: Record<keyof LabQueryParameterValues, true> = {
  preset: true,
  wave1: true,
  wave2: true,
  amplitude1: true,
  amplitude2: true,
  wavelength1: true,
  wavelength2: true,
  phase: true,
  reverse1: true,
  sum: true,
  material: true,
  sameAsWave1: true,
  materialLength: true,
  n1: true,
  n2: true,
  kappa1: true,
  kappa2: true,
};
export const LAB_QUERY_PARAMETER_KEYS = Object.keys(LAB_QUERY_PARAMETER_KEY_RECORD) as ReadonlyArray<
  keyof LabQueryParameterValues
>;

/**
 * Builds the Lab's initial state: defaults, then the preset (if any), then
 * each explicitly provided parameter, then range/grid clamping. The returned
 * selection is the preset while the resulting state still equals the preset's
 * (so no-op overrides like `?preset=absorption&kappa1=0.25` keep the preset
 * selected), else "custom".
 */
export function stateFromQueryParameters(values: LabQueryParameterValues): {
  state: WaveSceneState;
  selection: LabPresetSelection;
} {
  const state = values.preset ? getLabPresetState(values.preset) : defaultWaveSceneState();

  const applyWave = (wave: WaveState, value: WaveQueryValue | undefined): void => {
    if (value !== undefined) {
      wave.enabled = value !== "off";
      if (value !== "off") {
        wave.polarization = value;
      }
    }
  };
  const apply = <T>(value: T | undefined, set: (value: T) => void): void => {
    if (value !== undefined) {
      set(value);
    }
  };

  applyWave(state.wave1, values.wave1);
  applyWave(state.wave2, values.wave2);
  apply(values.amplitude1, (v) => {
    state.wave1.amplitude = v;
  });
  apply(values.amplitude2, (v) => {
    state.wave2.amplitude = v;
  });
  apply(values.wavelength1, (v) => {
    state.wave1.wavelengthNumber = v;
  });
  apply(values.wavelength2, (v) => {
    state.wave2.wavelengthNumber = v;
  });
  apply(values.phase, (v) => {
    state.wave2.phaseDegrees = v;
  });
  apply(values.reverse1, (v) => {
    state.wave1.reversed = v;
  });
  apply(values.sum, (v) => {
    state.sumEnabled = v;
  });
  apply(values.material, (v) => {
    state.material.enabled = v;
  });
  apply(values.sameAsWave1, (v) => {
    state.material.sameAsWave1 = v;
  });
  apply(values.materialLength, (v) => {
    state.material.lengthNumber = v;
  });
  apply(values.n1, (v) => {
    state.material.n1 = v;
  });
  apply(values.n2, (v) => {
    state.material.n2 = v;
  });
  apply(values.kappa1, (v) => {
    state.material.kappa1 = v;
  });
  apply(values.kappa2, (v) => {
    state.material.kappa2 = v;
  });

  const clamped = clampWaveSceneState(state);
  // "vertical" doubles as the no-preset candidate: its state IS the defaults.
  const candidate = values.preset ?? "vertical";
  return {
    state: clamped,
    selection: waveSceneStatesEqual(clamped, getLabPresetState(candidate)) ? candidate : "custom",
  };
}

/** A wave's query value: its polarization while on, "off" otherwise. */
function waveQueryValue(wave: WaveState): WaveQueryValue {
  return wave.enabled ? wave.polarization : "off";
}

/**
 * Serializes a scene state as a permalink query string (no leading "?"),
 * containing only the parameters that differ from the defaults. The empty
 * string means the state IS the default. The state is clamped first, so the
 * emitted link always parses back to the same (valid) state — e.g. a sum
 * flag left on while a wave is off is dropped rather than serialized.
 */
export function queryStringFromState(providedState: WaveSceneState): string {
  const state = clampWaveSceneState(providedState);
  const defaults = defaultWaveSceneState();
  const parts: string[] = [];
  const addIfChanged = (
    key: string,
    value: string | number | boolean,
    defaultValue: string | number | boolean,
  ): void => {
    if (value !== defaultValue) {
      parts.push(`${key}=${value}`);
    }
  };

  addIfChanged("wave1", waveQueryValue(state.wave1), waveQueryValue(defaults.wave1));
  addIfChanged("wave2", waveQueryValue(state.wave2), waveQueryValue(defaults.wave2));
  addIfChanged("amplitude1", state.wave1.amplitude, defaults.wave1.amplitude);
  addIfChanged("amplitude2", state.wave2.amplitude, defaults.wave2.amplitude);
  addIfChanged("wavelength1", state.wave1.wavelengthNumber, defaults.wave1.wavelengthNumber);
  addIfChanged("wavelength2", state.wave2.wavelengthNumber, defaults.wave2.wavelengthNumber);
  addIfChanged("phase", state.wave2.phaseDegrees, defaults.wave2.phaseDegrees);
  addIfChanged("reverse1", state.wave1.reversed, defaults.wave1.reversed);
  addIfChanged("sum", state.sumEnabled, defaults.sumEnabled);
  addIfChanged("material", state.material.enabled, defaults.material.enabled);
  addIfChanged("sameAsWave1", state.material.sameAsWave1, defaults.material.sameAsWave1);
  addIfChanged("materialLength", state.material.lengthNumber, defaults.material.lengthNumber);
  addIfChanged("n1", state.material.n1, defaults.material.n1);
  addIfChanged("n2", state.material.n2, defaults.material.n2);
  addIfChanged("kappa1", state.material.kappa1, defaults.material.kappa1);
  addIfChanged("kappa2", state.material.kappa2, defaults.material.kappa2);

  return parts.join("&");
}

/**
 * The full query string (no leading "?") for the Copy-link permalink: the
 * current URL's query with every Lab state parameter replaced by `state`'s
 * serialization. Parameters the mapping does not own — locale, screen
 * selection, the wavelengthDependentAbsorption preference (which changes the
 * physics!) — pass through untouched, so the copied link reproduces the whole
 * session, not just the Lab state.
 */
export function permalinkQueryString(currentSearch: string, state: WaveSceneState): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of LAB_QUERY_PARAMETER_KEYS) {
    params.delete(key);
  }
  const stateQuery = queryStringFromState(state);
  const parts = [params.toString(), stateQuery].filter((part) => part.length > 0);
  return parts.join("&");
}
