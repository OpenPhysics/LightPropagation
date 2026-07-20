/**
 * IntroScreenSummaryContent.ts
 *
 * The accessible screen summary for the Intro screen. The current-details
 * paragraph is a live PatternStringProperty over the wave's polarization,
 * amplitude, wavelength and play state, so screen-reader users can re-read
 * the up-to-date state at any time.
 */
import { PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { motionStatePhraseProperty, polarizationPhraseProperty } from "../../common/view/summaryPhrases.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { IntroModel } from "../model/IntroModel.js";

export class IntroScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: IntroModel) {
    const a11y = StringManager.getInstance().getIntroA11yStrings();

    const currentDetailsProperty = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      polarization: polarizationPhraseProperty(model.scene.wave1.polarizationProperty),
      amplitude: model.scene.wave1.amplitudeProperty,
      wavelength: model.scene.wave1.wavelengthNumberProperty,
      motionState: motionStatePhraseProperty(model.scene.timer.isPlayingProperty),
    });

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
