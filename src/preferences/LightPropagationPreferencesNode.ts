/**
 * LightPropagationPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to LightPropagationPreferencesModel Properties (whose initial values come from
 * lightPropagationQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import LightPropagationColors from "../LightPropagationColors.js";
import LightPropagationNamespace from "../LightPropagationNamespace.js";
import type { LightPropagationPreferencesModel } from "./LightPropagationPreferencesModel.js";

/** Preferences dialog content sits on a light background regardless of color profile. */
const PREFERENCES_TEXT_FILL = LightPropagationColors.controlSurfaceTextColorProperty;

export class LightPropagationPreferencesNode extends VBox {
  public constructor(preferencesModel: LightPropagationPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: PREFERENCES_TEXT_FILL,
    });

    const exampleToggleCheckbox = new Checkbox(
      preferencesModel.exampleToggleProperty,
      new Text(prefStrings.exampleToggleStringProperty, {
        font: new PhetFont(14),
        fill: PREFERENCES_TEXT_FILL,
      }),
      {
        checkboxColor: PREFERENCES_TEXT_FILL,
        checkboxColorBackground: LightPropagationColors.controlSurfaceColorProperty,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("exampleToggleCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: 12,
      children: [header, exampleToggleCheckbox],
    });
  }
}

LightPropagationNamespace.register("LightPropagationPreferencesNode", LightPropagationPreferencesNode);
