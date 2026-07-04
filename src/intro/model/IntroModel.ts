/**
 * IntroModel.ts
 *
 * Model for the Intro screen: a single wave (wave 2 and the material are
 * off and have no controls here), introducing polarization, amplitude,
 * wavelength and the 3D view. E-field vectors start visible so the very
 * first frame already shows the field arrows.
 */
import type { TModel } from "scenerystack/joist";
import { WaveSceneModel } from "../../common/model/WaveSceneModel.js";

export class IntroModel implements TModel {
  // Defaults are exactly what Intro wants: wave 1 vertical and on, wave 2
  // off, no material, no sum.
  public readonly scene = new WaveSceneModel(undefined, { eVectorsVisible: true });

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
