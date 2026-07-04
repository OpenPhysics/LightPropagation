/**
 * WavePlatesScreenSummaryContent.ts
 *
 * The accessible screen summary for the Wave Plates screen. The
 * current-details paragraph is a live PatternStringProperty over the two
 * component amplitudes, the phase difference, whether the plate is inserted,
 * its retardation in degrees, and the play state.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { booleanPhraseProperty, motionStatePhraseProperty } from "../../common/view/summaryPhrases.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { WavePlatesModel } from "../model/WavePlatesModel.js";

export class WavePlatesScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: WavePlatesModel) {
    const a11y = StringManager.getInstance().getWavePlatesA11yStrings();
    const scene = model.scene;

    const retardationDegreesProperty = new DerivedProperty(
      [model.retardationRadiansProperty],
      (radians) => Math.round((radians * 1800) / Math.PI) / 10,
    );

    const currentDetailsProperty = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      amplitude1: scene.wave1.amplitudeProperty,
      amplitude2: scene.wave2.amplitudeProperty,
      phase: scene.wave2.phaseDegreesProperty,
      plateState: booleanPhraseProperty(
        scene.material.enabledProperty,
        a11y.plateInsertedStringProperty,
        a11y.plateRemovedStringProperty,
      ),
      retardation: retardationDegreesProperty,
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
