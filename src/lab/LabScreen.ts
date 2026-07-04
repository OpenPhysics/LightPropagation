/**
 * LabScreen.ts
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
import { getLabQueryParameterValues } from "../preferences/lightPropagationQueryParameters.js";
import { LabModel } from "./model/LabModel.js";
import { stateFromQueryParameters } from "./model/labQueryParameterMapping.js";
import { LabKeyboardHelpContent } from "./view/LabKeyboardHelpContent.js";
import { LabScreenView } from "./view/LabScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type LabScreenOptions = ScreenOptions & { tandem: Tandem };

export class LabScreen extends Screen<LabModel, LabScreenView> {
  public constructor(options: LabScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown. The
      // initial state comes from the permalink query parameters (which is the
      // plain default state when none are given), so Reset All restores the
      // permalinked configuration.
      () => new LabModel(stateFromQueryParameters(getLabQueryParameterValues())),
      // View factory — receives the model instance
      (model) =>
        new LabScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<LabScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new LabKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
