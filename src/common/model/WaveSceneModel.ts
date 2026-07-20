/**
 * WaveSceneModel.ts
 *
 * The shared core of every screen model: two EMWaves, an OpticalMaterial,
 * a FieldSampler, play/pause + speed, and the display toggles. Screens
 * compose this class (as `scene`) with a screen-appropriate initial state;
 * reset() restores that initial state.
 *
 * Time is kept in EMANIM axis units: step(dt) advances the clock by
 * dt · speed · TIME_SCALE, so at normal speed the wave animates at exactly
 * EMANIM's pace (π/18 axis units per 1/30 s).
 */

import { BooleanProperty, DerivedProperty, EnumerationProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { TimeSpeed } from "scenerystack/scenery-phet";
import { TIME_SCALE, WAVE_SAMPLE_STEP } from "../../LightPropagationConstants.js";
import { TimeModel } from "../TimeModel.js";
import { EMWave } from "./EMWave.js";
import { FieldSampler, type SampledWave } from "./FieldSampler.js";
import { OpticalMaterial } from "./OpticalMaterial.js";
import type { MaterialSnapshot } from "./WaveEquations.js";
import {
  clampWaveSceneState,
  mergeWaveSceneState,
  type PartialWaveSceneState,
  type WaveSceneState,
} from "./WaveSceneState.js";

const SPEED_MULTIPLIERS = new Map<TimeSpeed, number>([
  [TimeSpeed.SLOW, 0.25],
  [TimeSpeed.NORMAL, 1],
  [TimeSpeed.FAST, 2],
]);

export type WaveSceneDisplayOptions = {
  /** Initial visibility of the E-field end arrows. */
  eVectorsVisible?: boolean;
  /** Initial visibility of the magnetic-field curves. */
  bFieldVisible?: boolean;
};

export class WaveSceneModel {
  /** Play/pause + elapsed time. Time is in EMANIM axis units, not seconds. */
  public readonly timer = new TimeModel(true);

  public readonly timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL);

  public readonly wave1: EMWave;
  public readonly wave2: EMWave;
  public readonly material: OpticalMaterial;

  /** Whether the superposition of the two waves is computed and shown. */
  public readonly sumEnabledProperty: BooleanProperty;

  /** Whether the sum may be enabled: both waves must be on (the EMANIM rule). */
  public readonly sumAllowedProperty: TReadOnlyProperty<boolean>;

  /** Show/hide the per-wave field curves (arrows keep animating when hidden). */
  public readonly componentCurvesVisibleProperty = new BooleanProperty(true);

  /** Show/hide the sum field curve. */
  public readonly sumCurveVisibleProperty = new BooleanProperty(true);

  /** Show/hide the E-field arrows at the ends of each visible curve. */
  public readonly eVectorsVisibleProperty: BooleanProperty;

  /** Show/hide the magnetic-field curves (our extension over EMANIM). */
  public readonly bFieldVisibleProperty: BooleanProperty;

  public readonly sampler = new FieldSampler();

  /**
   * Every Property that belongs to the serializable WaveSceneState, in one
   * flat list — LabModel watches these to flip its preset selector to
   * "custom" on any manual change.
   */
  public readonly stateProperties: ReadonlyArray<TReadOnlyProperty<unknown>>;

  // Reusable snapshots so per-frame sampling is allocation-free.
  private readonly wave1Snapshot: SampledWave;
  private readonly wave2Snapshot: SampledWave;
  private readonly materialSnapshot: MaterialSnapshot;

  private _isApplyingState = false;

  // True when a state Property changed since the last sampleNow(), so step()
  // can skip resampling while paused with nothing edited.
  private sampleDirty = false;

  public constructor(initialState?: PartialWaveSceneState, displayOptions?: WaveSceneDisplayOptions) {
    const state = clampWaveSceneState(mergeWaveSceneState(initialState));

    this.wave1 = new EMWave(state.wave1);
    this.wave2 = new EMWave(state.wave2);
    this.material = new OpticalMaterial(state.material);
    this.sumEnabledProperty = new BooleanProperty(state.sumEnabled);
    this.eVectorsVisibleProperty = new BooleanProperty(displayOptions?.eVectorsVisible ?? true);
    this.bFieldVisibleProperty = new BooleanProperty(displayOptions?.bFieldVisible ?? false);

    // EMANIM rule: turning either wave off turns the sum off.
    const enforceSumRule = (enabled: boolean): void => {
      if (!enabled) {
        this.sumEnabledProperty.value = false;
      }
    };
    this.wave1.enabledProperty.lazyLink(enforceSumRule);
    this.wave2.enabledProperty.lazyLink(enforceSumRule);

    this.sumAllowedProperty = new DerivedProperty(
      [this.wave1.enabledProperty, this.wave2.enabledProperty],
      (wave1Enabled, wave2Enabled) => wave1Enabled && wave2Enabled,
    );

    this.wave1Snapshot = this.createSnapshot(this.wave1);
    this.wave2Snapshot = this.createSnapshot(this.wave2);
    this.materialSnapshot = { enabled: false, halfLength: 0 };

    this.stateProperties = [
      this.wave1.enabledProperty,
      this.wave1.polarizationProperty,
      this.wave1.amplitudeProperty,
      this.wave1.wavelengthNumberProperty,
      this.wave1.phaseDegreesProperty,
      this.wave1.reversedProperty,
      this.wave2.enabledProperty,
      this.wave2.polarizationProperty,
      this.wave2.amplitudeProperty,
      this.wave2.wavelengthNumberProperty,
      this.wave2.phaseDegreesProperty,
      this.wave2.reversedProperty,
      this.material.enabledProperty,
      this.material.lengthNumberProperty,
      this.material.n1Property,
      this.material.kappa1Property,
      this.material.n2Property,
      this.material.kappa2Property,
      this.material.sameAsWave1Property,
      this.sumEnabledProperty,
    ];

    // Sampling depends on exactly the serializable state (plus time), so any
    // state change marks the buffers stale for the next step().
    for (const stateProperty of this.stateProperties) {
      stateProperty.lazyLink(() => {
        this.sampleDirty = true;
      });
    }

    this.sampleNow();
  }

  private createSnapshot(wave: EMWave): SampledWave {
    return {
      enabled: wave.enabledProperty.value,
      polarization: wave.polarizationProperty.value,
      amplitude: wave.amplitudeProperty.value,
      reducedWavelength: wave.reducedWavelength,
      phaseRadians: (wave.phaseDegreesProperty.value * Math.PI) / 180,
      direction: wave.reversedProperty.value ? -1 : 1,
      refractiveIndex: 1,
      extinction: 0,
    };
  }

  private refreshSnapshot(snapshot: SampledWave, wave: EMWave, n: number, kappa: number): void {
    snapshot.enabled = wave.enabledProperty.value;
    snapshot.polarization = wave.polarizationProperty.value;
    snapshot.amplitude = wave.amplitudeProperty.value;
    snapshot.reducedWavelength = wave.reducedWavelength;
    snapshot.phaseRadians = (wave.phaseDegreesProperty.value * Math.PI) / 180;
    snapshot.direction = wave.reversedProperty.value ? -1 : 1;
    snapshot.refractiveIndex = n;
    snapshot.extinction = kappa;
  }

  /** True while applyState()/reset() is writing Properties in bulk. */
  public get isApplyingState(): boolean {
    return this._isApplyingState;
  }

  /**
   * Advances the clock (if playing) and refreshes the field buffers.
   * @param dt - elapsed real time in seconds
   */
  public step(dt: number): void {
    const multiplier = SPEED_MULTIPLIERS.get(this.timeSpeedProperty.value) ?? 1;
    const timeBefore = this.timer.timeProperty.value;
    this.timer.step(dt * multiplier * TIME_SCALE);
    if (this.timer.timeProperty.value !== timeBefore || this.sampleDirty) {
      this.sampleNow();
    }
  }

  /** Advances time by one EMANIM frame (π/18 axis units), even while paused. */
  public stepFrame(): void {
    this.timer.timeProperty.value += WAVE_SAMPLE_STEP;
    this.sampleNow();
  }

  /** Refreshes the FieldSampler buffers from the current Properties. */
  public sampleNow(): void {
    this.refreshSnapshot(
      this.wave1Snapshot,
      this.wave1,
      this.material.n1Property.value,
      this.material.kappa1Property.value,
    );
    this.refreshSnapshot(
      this.wave2Snapshot,
      this.wave2,
      this.material.n2Property.value,
      this.material.kappa2Property.value,
    );
    this.materialSnapshot.enabled = this.material.enabledProperty.value;
    this.materialSnapshot.halfLength = this.material.length / 2;
    this.sampler.sample(this.timer.timeProperty.value, this.wave1Snapshot, this.wave2Snapshot, this.materialSnapshot);
    this.sampleDirty = false;
  }

  /** Applies a full physics state (used by presets and permalinks). */
  public applyState(state: WaveSceneState): void {
    const clamped = clampWaveSceneState(state);
    this._isApplyingState = true;
    this.wave1.applyState(clamped.wave1);
    this.wave2.applyState(clamped.wave2);
    this.material.applyState(clamped.material);
    this.sumEnabledProperty.value = clamped.sumEnabled;
    this._isApplyingState = false;
    this.sampleNow();
  }

  public getState(): WaveSceneState {
    return {
      wave1: this.wave1.getState(),
      wave2: this.wave2.getState(),
      material: this.material.getState(),
      sumEnabled: this.sumEnabledProperty.value,
    };
  }

  /** Restores the screen's initial state (the state passed to the constructor). */
  public reset(): void {
    this._isApplyingState = true;
    this.timer.reset();
    this.timeSpeedProperty.reset();
    this.wave1.reset();
    this.wave2.reset();
    this.material.reset();
    this.sumEnabledProperty.reset();
    this.componentCurvesVisibleProperty.reset();
    this.sumCurveVisibleProperty.reset();
    this.eVectorsVisibleProperty.reset();
    this.bFieldVisibleProperty.reset();
    this._isApplyingState = false;
    this.sampleNow();
  }
}
