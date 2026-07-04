/**
 * IntroScreenSummaryContent.ts
 *
 * The accessible screen summary for the Intro screen. The current-details
 * paragraph is a live PatternStringProperty over the wave's polarization,
 * amplitude, wavelength and play state, so screen-reader users can re-read
 * the up-to-date state at any time.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import type { PolarizationType } from "../../common/model/PolarizationType.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { IntroModel } from "../model/IntroModel.js";

export class IntroScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: IntroModel) {
    const a11y = StringManager.getInstance().getIntroA11yStrings();
    const common = StringManager.getInstance().getCommonA11yStrings();

    const polarizationPhraseProperty = DerivedProperty.deriveAny(
      [
        model.scene.wave1.polarizationProperty,
        common.polarizationDescription.verticalStringProperty,
        common.polarizationDescription.horizontalStringProperty,
        common.polarizationDescription.leftCircularStringProperty,
        common.polarizationDescription.rightCircularStringProperty,
      ],
      () => {
        const phrases: Record<PolarizationType, string> = {
          vertical: common.polarizationDescription.verticalStringProperty.value,
          horizontal: common.polarizationDescription.horizontalStringProperty.value,
          leftCircular: common.polarizationDescription.leftCircularStringProperty.value,
          rightCircular: common.polarizationDescription.rightCircularStringProperty.value,
        };
        return phrases[model.scene.wave1.polarizationProperty.value];
      },
    );

    const motionStateProperty = DerivedProperty.deriveAny(
      [model.scene.timer.isPlayingProperty, common.motionPlayingStringProperty, common.motionPausedStringProperty],
      () =>
        model.scene.timer.isPlayingProperty.value
          ? common.motionPlayingStringProperty.value
          : common.motionPausedStringProperty.value,
    );

    const currentDetailsProperty = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      polarization: polarizationPhraseProperty,
      amplitude: model.scene.wave1.amplitudeProperty,
      wavelength: model.scene.wave1.wavelengthNumberProperty,
      motionState: motionStateProperty,
    });

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
