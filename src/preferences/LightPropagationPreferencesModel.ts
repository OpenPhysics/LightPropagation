/**
 * LightPropagationPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in lightPropagationQueryParameters.
 *
 * A singleton (like StringManager): the Preferences dialog UI and the screen
 * models that consume a preference must share one instance, and screens are
 * constructed independently in main.ts.
 */

import { BooleanProperty } from "scenerystack/axon";
import LightPropagationNamespace from "../LightPropagationNamespace.js";
import lightPropagationQueryParameters from "./lightPropagationQueryParameters.js";

export class LightPropagationPreferencesModel {
  private static instance: LightPropagationPreferencesModel | null = null;

  /**
   * When true, the material's absorption follows the physical Beer–Lambert
   * law D = exp(−κ·Δx/ƛ), so shorter wavelengths are absorbed more strongly.
   * When false (default), it follows EMANIM's wavelength-independent law
   * D = exp(−κ·Δx/π) for exact parity with the original app. See doc/model.md.
   */
  public readonly wavelengthDependentAbsorptionProperty: BooleanProperty;

  private constructor() {
    this.wavelengthDependentAbsorptionProperty = new BooleanProperty(
      lightPropagationQueryParameters.wavelengthDependentAbsorption,
    );
  }

  public static getInstance(): LightPropagationPreferencesModel {
    if (LightPropagationPreferencesModel.instance === null) {
      LightPropagationPreferencesModel.instance = new LightPropagationPreferencesModel();
    }
    return LightPropagationPreferencesModel.instance;
  }

  public reset(): void {
    this.wavelengthDependentAbsorptionProperty.reset();
  }
}

LightPropagationNamespace.register("LightPropagationPreferencesModel", LightPropagationPreferencesModel);
