/**
 * summaryPhrases.ts
 *
 * Small factories for the live phrase Properties used by every screen's
 * accessible summary: a wave's polarization description ("vertically
 * polarized"), and boolean state phrases (inserted/removed, animating/paused).
 * Each result also re-derives when the locale changes.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringManager } from "../../i18n/StringManager.js";
import type { PolarizationType } from "../model/PolarizationType.js";

/** Localized "vertically polarized" (etc.) phrase for a wave's current polarization. */
export function polarizationPhraseProperty(
  polarizationProperty: TReadOnlyProperty<PolarizationType>,
): TReadOnlyProperty<string> {
  const common = StringManager.getInstance().getCommonA11yStrings();
  const phraseProperties: Record<PolarizationType, TReadOnlyProperty<string>> = {
    vertical: common.polarizationDescription.verticalStringProperty,
    horizontal: common.polarizationDescription.horizontalStringProperty,
    leftCircular: common.polarizationDescription.leftCircularStringProperty,
    rightCircular: common.polarizationDescription.rightCircularStringProperty,
  };
  return DerivedProperty.deriveAny(
    [polarizationProperty, ...Object.values(phraseProperties)],
    () => phraseProperties[polarizationProperty.value].value,
  );
}

/** Selects between two localized phrases on a boolean Property. */
export function booleanPhraseProperty(
  valueProperty: TReadOnlyProperty<boolean>,
  trueStringProperty: TReadOnlyProperty<string>,
  falseStringProperty: TReadOnlyProperty<string>,
): TReadOnlyProperty<string> {
  return DerivedProperty.deriveAny([valueProperty, trueStringProperty, falseStringProperty], () =>
    valueProperty.value ? trueStringProperty.value : falseStringProperty.value,
  );
}

/** Localized "animating" / "paused" phrase for the play state. */
export function motionStatePhraseProperty(isPlayingProperty: TReadOnlyProperty<boolean>): TReadOnlyProperty<string> {
  const common = StringManager.getInstance().getCommonA11yStrings();
  return booleanPhraseProperty(
    isPlayingProperty,
    common.motionPlayingStringProperty,
    common.motionPausedStringProperty,
  );
}
