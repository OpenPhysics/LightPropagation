/**
 * LabScreenSummaryContent.ts
 *
 * The accessible screen summary for the Lab screen. The current-details
 * paragraph is a live PatternStringProperty over each wave's on/off state and
 * polarization, whether the material is inserted, and the play state.
 */
import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import type { EMWave } from "../../common/model/EMWave.js";
import {
  booleanPhraseProperty,
  motionStatePhraseProperty,
  polarizationPhraseProperty,
} from "../../common/view/summaryPhrases.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LabModel } from "../model/LabModel.js";

export class LabScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: LabModel) {
    const a11y = StringManager.getInstance().getLabA11yStrings();
    const scene = model.scene;

    // "vertically polarized" while the wave is on, "off" otherwise.
    const waveStateProperty = (wave: EMWave): TReadOnlyProperty<string> => {
      const phraseProperty = polarizationPhraseProperty(wave.polarizationProperty);
      return DerivedProperty.deriveAny([wave.enabledProperty, phraseProperty, a11y.waveOffStringProperty], () =>
        wave.enabledProperty.value ? phraseProperty.value : a11y.waveOffStringProperty.value,
      );
    };

    const currentDetailsProperty = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      wave1State: waveStateProperty(scene.wave1),
      wave2State: waveStateProperty(scene.wave2),
      materialState: booleanPhraseProperty(
        scene.material.enabledProperty,
        a11y.materialInsertedStringProperty,
        a11y.materialRemovedStringProperty,
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
