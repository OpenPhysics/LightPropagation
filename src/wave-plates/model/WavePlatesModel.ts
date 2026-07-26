/**
 * WavePlatesModel.ts
 *
 * Model for the Wave Plates screen: a light wave decomposed into a locked
 * vertical component (wave 1) and horizontal component (wave 2), passing
 * through an n-only birefringent slab (κ stays 0, so nothing is absorbed).
 * The per-component refractive indices delay one component relative to the
 * other; the resulting retardation Δφ = (n₁ − n₂)·L/ƛ is exposed as a live
 * Property for the view's readout.
 *
 * The initial state is an exact quarter-wave plate: at the locked w = 4
 * (ƛ = 1), m = 20 and n₁ = 1.05, n₂ = 1.00 give Δφ = 0.05·20·(π/2) = π/2.
 * The half-wave preset doubles the index contrast: n₁ = 1.10 gives Δφ = π.
 * (The default m = 16 cannot reach π/2 exactly with 0.05 index steps, which
 * is why the plate presets use m = 20.)
 */
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { WaveSceneModel } from "../../common/model/WaveSceneModel.js";

/** Exact on-grid quarter-wave plate at w = 4. */
export const QUARTER_WAVE_PLATE = { lengthNumber: 20, n1: 1.05, n2: 1.0 };

/** Exact on-grid half-wave plate at w = 4. */
export const HALF_WAVE_PLATE = { lengthNumber: 20, n1: 1.1, n2: 1.0 };

export class WavePlatesModel implements TModel {
  public readonly scene = new WaveSceneModel({
    wave1: { enabled: true, polarization: "vertical" },
    wave2: { enabled: true, polarization: "horizontal" },
    material: { enabled: true, ...QUARTER_WAVE_PLATE },
    sumEnabled: true,
  });

  /**
   * The plate's retardation Δφ = (n₁ − n₂)·L/ƛ in radians; 0 while the plate
   * is out of the scene.
   *
   * ƛ is read from wave 1 only. That is valid because this screen models ONE
   * wave split into two components: the view hides both wavelength controls,
   * so both waves stay locked at the initial w = 4. If this screen ever gets
   * a wavelength control, drive both waves' wavelengths from it together.
   */
  public readonly retardationRadiansProperty: TReadOnlyProperty<number>;

  /**
   * The retardation *magnitude* |Δφ| in degrees, rounded to 0.1°, for the
   * screen's readouts (the panel and the accessible summary share this one
   * Property rather than each rounding the radians themselves).
   *
   * The sign of Δφ only says which component is retarded, and the "Fast axis"
   * readout states that in words; a plate is conventionally specified by how
   * much retardation it introduces, so the numbers quote the magnitude rather
   * than showing "−90°" whenever the horizontal index is the larger one.
   */
  public readonly retardationDegreesProperty: TReadOnlyProperty<number>;

  public constructor() {
    const material = this.scene.material;
    this.retardationRadiansProperty = DerivedProperty.deriveAny(
      [
        material.enabledProperty,
        material.n1Property,
        material.n2Property,
        material.lengthNumberProperty,
        this.scene.wave1.wavelengthNumberProperty,
      ],
      () =>
        material.enabledProperty.value
          ? ((material.n1Property.value - material.n2Property.value) * material.length) /
            this.scene.wave1.reducedWavelength
          : 0,
    );
    this.retardationDegreesProperty = new DerivedProperty(
      [this.retardationRadiansProperty],
      (radians) => Math.round((Math.abs(radians) * 1800) / Math.PI) / 10,
    );
  }

  /** Configures the slab as an exact quarter-wave plate (Δφ = π/2). */
  public applyQuarterWavePlate(): void {
    this.applyPlate(QUARTER_WAVE_PLATE);
  }

  /** Configures the slab as an exact half-wave plate (Δφ = π). */
  public applyHalfWavePlate(): void {
    this.applyPlate(HALF_WAVE_PLATE);
  }

  private applyPlate(plate: { lengthNumber: number; n1: number; n2: number }): void {
    const material = this.scene.material;
    material.enabledProperty.value = true;
    material.lengthNumberProperty.value = plate.lengthNumber;
    material.n1Property.value = plate.n1;
    material.n2Property.value = plate.n2;
  }

  /**
   * Resets all model state to initial values.
   * Called when the user presses the Reset All button.
   */
  public reset(): void {
    this.scene.reset();
  }

  /**
   * Steps the model forward by dt seconds.
   * @param dt - elapsed time in seconds since the last frame
   */
  public step(dt: number): void {
    this.scene.step(dt);
  }
}
