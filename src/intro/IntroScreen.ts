/**
 * IntroScreen.ts
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
import { IntroModel } from "./model/IntroModel.js";
import { IntroKeyboardHelpContent } from "./view/IntroKeyboardHelpContent.js";
import { IntroScreenView } from "./view/IntroScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type IntroScreenOptions = ScreenOptions & { tandem: Tandem };

export class IntroScreen extends Screen<IntroModel, IntroScreenView> {
  public constructor(options: IntroScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new IntroModel(),
      // View factory — receives the model instance
      (model) =>
        new IntroScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<IntroScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new IntroKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
