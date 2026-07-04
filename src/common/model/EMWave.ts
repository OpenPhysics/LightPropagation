/**
 * EMWave.ts
 *
 * Reactive model of one electromagnetic wave: its polarization, amplitude,
 * wavelength number, phase offset and travel direction. Property initial
 * values come from the screen's initial WaveState, so reset() restores the
 * screen's starting configuration (not the global EMANIM defaults).
 *
 * The per-wave material response (n, κ) lives on OpticalMaterial; the
 * WaveSceneModel combines both into the WaveSnapshot consumed by
 * WaveEquations/FieldSampler.
 */

import { BooleanProperty, NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { AMPLITUDE_RANGE, PHASE_DEGREES_RANGE, WAVELENGTH_NUMBER_RANGE } from "../../LightPropagationConstants.js";
import { type PolarizationType, PolarizationTypeValues } from "./PolarizationType.js";
import type { WaveState } from "./WaveSceneState.js";

export class EMWave {
  /** Whether this wave is shown and contributes to the sum. */
  public readonly enabledProperty: BooleanProperty;

  public readonly polarizationProperty: StringUnionProperty<PolarizationType>;

  /** Amplitude A, 0–10 (arbitrary units). */
  public readonly amplitudeProperty: NumberProperty;

  /** Integer wavelength number w, 1–8; reduced wavelength ƛ = w/4. */
  public readonly wavelengthNumberProperty: NumberProperty;

  /** Phase offset δ in degrees (the wave-2 "phase difference" control). */
  public readonly phaseDegreesProperty: NumberProperty;

  /** Whether the wave travels toward −x (wave 1's "reverse direction" control). */
  public readonly reversedProperty: BooleanProperty;

  public constructor(initialState: WaveState) {
    this.enabledProperty = new BooleanProperty(initialState.enabled);
    this.polarizationProperty = new StringUnionProperty<PolarizationType>(initialState.polarization, {
      validValues: PolarizationTypeValues,
    });
    this.amplitudeProperty = new NumberProperty(initialState.amplitude, { range: AMPLITUDE_RANGE });
    this.wavelengthNumberProperty = new NumberProperty(initialState.wavelengthNumber, {
      range: WAVELENGTH_NUMBER_RANGE,
      numberType: "Integer",
    });
    this.phaseDegreesProperty = new NumberProperty(initialState.phaseDegrees, { range: PHASE_DEGREES_RANGE });
    this.reversedProperty = new BooleanProperty(initialState.reversed);
  }

  /** The reduced wavelength ƛ = w/4. */
  public get reducedWavelength(): number {
    return this.wavelengthNumberProperty.value / 4;
  }

  public applyState(state: WaveState): void {
    this.enabledProperty.value = state.enabled;
    this.polarizationProperty.value = state.polarization;
    this.amplitudeProperty.value = state.amplitude;
    this.wavelengthNumberProperty.value = state.wavelengthNumber;
    this.phaseDegreesProperty.value = state.phaseDegrees;
    this.reversedProperty.value = state.reversed;
  }

  public getState(): WaveState {
    return {
      enabled: this.enabledProperty.value,
      polarization: this.polarizationProperty.value,
      amplitude: this.amplitudeProperty.value,
      wavelengthNumber: this.wavelengthNumberProperty.value,
      phaseDegrees: this.phaseDegreesProperty.value,
      reversed: this.reversedProperty.value,
    };
  }

  public reset(): void {
    this.enabledProperty.reset();
    this.polarizationProperty.reset();
    this.amplitudeProperty.reset();
    this.wavelengthNumberProperty.reset();
    this.phaseDegreesProperty.reset();
    this.reversedProperty.reset();
  }
}
