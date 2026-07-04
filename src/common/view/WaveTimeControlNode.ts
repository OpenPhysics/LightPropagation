/**
 * WaveTimeControlNode.ts
 *
 * The sim's TimeControlNode: play/pause + step-forward + slow/normal/fast
 * radio buttons, bound to a WaveSceneModel's timer and speed, with the flat
 * button appearance and readable speed-radio labels.
 */

import { TimeControlNode, type TimeControlNodeOptions } from "scenerystack/scenery-phet";
import {
  FLAT_BUTTON_APPEARANCE_OPTIONS,
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  TIME_CONTROL_SPEED_RADIO_OPTIONS,
} from "../LightPropagationButtonOptions.js";
import type { WaveSceneModel } from "../model/WaveSceneModel.js";

export class WaveTimeControlNode extends TimeControlNode {
  public constructor(scene: WaveSceneModel, providedOptions?: TimeControlNodeOptions) {
    super(scene.timer.isPlayingProperty, {
      timeSpeedProperty: scene.timeSpeedProperty,
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_BUTTON_APPEARANCE_OPTIONS,
          listener: () => scene.stepFrame(),
        },
      },
      ...TIME_CONTROL_SPEED_RADIO_OPTIONS,
      ...providedOptions,
    });
  }
}
