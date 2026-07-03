/**
 * WavePlatesScreen.ts
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
import { WavePlatesModel } from "./model/WavePlatesModel.js";
import { WavePlatesKeyboardHelpContent } from "./view/WavePlatesKeyboardHelpContent.js";
import { WavePlatesScreenView } from "./view/WavePlatesScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type WavePlatesScreenOptions = ScreenOptions & { tandem: Tandem };

export class WavePlatesScreen extends Screen<WavePlatesModel, WavePlatesScreenView> {
  public constructor(options: WavePlatesScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new WavePlatesModel(),
      // View factory — receives the model instance
      (model) =>
        new WavePlatesScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<WavePlatesScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new WavePlatesKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
