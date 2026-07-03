/**
 * PolarizationScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import LightPropagationColors from "../LightPropagationColors.js";
import { PolarizationModel } from "./model/PolarizationModel.js";
import { PolarizationKeyboardHelpContent } from "./view/PolarizationKeyboardHelpContent.js";
import { PolarizationScreenView } from "./view/PolarizationScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type PolarizationScreenOptions = ScreenOptions & { tandem: Tandem };

export class PolarizationScreen extends Screen<PolarizationModel, PolarizationScreenView> {
  public constructor(options: PolarizationScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new PolarizationModel(),
      // View factory — receives the model instance
      (model) =>
        new PolarizationScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<PolarizationScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new PolarizationKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
