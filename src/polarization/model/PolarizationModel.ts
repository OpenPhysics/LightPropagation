/**
 * PolarizationModel.ts
 *
 * Model for the Polarization screen: two always-on waves whose superposition
 * passes through an optional dichroic filter (polarizer) — a material with
 * per-wave extinction only (n stays 1.00, so there is no refraction or
 * birefringence on this screen).
 *
 * The initial state is EMANIM's "Linear + linear, in phase" preset: wave 1
 * vertical + wave 2 horizontal, equal amplitudes, δ = 0, sum shown.
 *
 * Both waves share one wavelength control: wave 1's wavelength number is the
 * source of truth and wave 2 tracks it (unequal wavelengths are Lab-only).
 */
import type { TModel } from "scenerystack/joist";
import { WaveSceneModel } from "../../common/model/WaveSceneModel.js";
import { LightPropagationPreferencesModel } from "../../preferences/LightPropagationPreferencesModel.js";

export class PolarizationModel implements TModel {
  public readonly scene = new WaveSceneModel(
    {
      wave1: { enabled: true, polarization: "vertical" },
      wave2: { enabled: true, polarization: "horizontal" },
      sumEnabled: true,
    },
    {
      wavelengthDependentAbsorptionProperty:
        LightPropagationPreferencesModel.getInstance().wavelengthDependentAbsorptionProperty,
    },
  );

  public constructor() {
    // One shared wavelength control drives both waves.
    this.scene.wave1.wavelengthNumberProperty.link((wavelengthNumber) => {
      this.scene.wave2.wavelengthNumberProperty.value = wavelengthNumber;
    });
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
