/**
 * PolarizationScreenSummaryContent.ts
 *
 * The accessible screen summary for the Polarization screen. The
 * current-details paragraph is a live PatternStringProperty over both waves'
 * polarization and amplitude, the phase difference, whether the polarizer is
 * inserted, and the play state.
 */
import { PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import {
  booleanPhraseProperty,
  motionStatePhraseProperty,
  polarizationPhraseProperty,
} from "../../common/view/summaryPhrases.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { PolarizationModel } from "../model/PolarizationModel.js";

export class PolarizationScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: PolarizationModel) {
    const a11y = StringManager.getInstance().getPolarizationA11yStrings();
    const scene = model.scene;

    const currentDetailsProperty = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      polarization1: polarizationPhraseProperty(scene.wave1.polarizationProperty),
      amplitude1: scene.wave1.amplitudeProperty,
      polarization2: polarizationPhraseProperty(scene.wave2.polarizationProperty),
      amplitude2: scene.wave2.amplitudeProperty,
      phase: scene.wave2.phaseDegreesProperty,
      polarizerState: booleanPhraseProperty(
        scene.material.enabledProperty,
        a11y.polarizerInsertedStringProperty,
        a11y.polarizerRemovedStringProperty,
      ),
      motionState: motionStatePhraseProperty(scene.timer.isPlayingProperty),
    });

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
