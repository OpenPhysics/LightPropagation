/**
 * LabModel.ts
 *
 * Model for the Lab screen: the full EMANIM control surface — two waves with
 * every per-wave control, the full material (n and κ per wave plus the
 * "same as wave 1" coupling), and a 20-entry preset selector.
 *
 * Selecting a preset applies its state to the scene; any manual change to a
 * scene state Property flips the selector to "custom" (the writes performed
 * by applyState/reset themselves are guarded out via scene.isApplyingState).
 */
import { StringUnionProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { WaveSceneModel } from "../../common/model/WaveSceneModel.js";
import type { WaveSceneState } from "../../common/model/WaveSceneState.js";
import { getLabPresetState, type LabPresetSelection, LabPresetSelectionValues } from "./LabPresets.js";

/** The screen's startup configuration (from permalink query parameters). */
export type LabInitialState = {
  state: WaveSceneState;
  selection: LabPresetSelection;
};

export class LabModel implements TModel {
  // The defaults are exactly the "Vertical" preset, so with no query
  // parameters the selector starts there.
  public readonly scene: WaveSceneModel;

  public readonly presetProperty: StringUnionProperty<LabPresetSelection>;

  public constructor(initial?: LabInitialState) {
    this.scene = new WaveSceneModel(initial?.state);
    this.presetProperty = new StringUnionProperty<LabPresetSelection>(initial?.selection ?? "vertical", {
      validValues: LabPresetSelectionValues,
    });
    this.presetProperty.lazyLink((preset) => {
      if (preset !== "custom") {
        this.scene.applyState(getLabPresetState(preset));
      }
    });

    // Any manual edit of the serializable state turns the selection custom.
    for (const stateProperty of this.scene.stateProperties) {
      stateProperty.lazyLink(() => {
        if (!this.scene.isApplyingState) {
          this.presetProperty.value = "custom";
        }
      });
    }
  }

  /**
   * Resets all model state to initial values.
   * Called when the user presses the Reset All button.
   */
  public reset(): void {
    this.scene.reset();
    this.presetProperty.reset();
  }

  /**
   * Steps the model forward by dt seconds.
   * @param dt - elapsed time in seconds since the last frame
   */
  public step(dt: number): void {
    this.scene.step(dt);
  }
}
