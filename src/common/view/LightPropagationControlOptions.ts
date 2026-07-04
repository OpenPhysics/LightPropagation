/**
 * LightPropagationControlOptions.ts
 *
 * Shared appearance bundles for panel controls (NumberControl, Checkbox,
 * radio groups, panel text), the companions to LightPropagationButtonOptions.
 * Spread these into the relevant options objects so every control matches the
 * sim's dark default / light projector theming.
 */

import { Dimension2 } from "scenerystack/dot";
import type { TextOptions } from "scenerystack/scenery";
import { type NumberControlOptions, PhetFont } from "scenerystack/scenery-phet";
import type { AquaRadioButtonGroupOptions, CheckboxOptions } from "scenerystack/sun";
import LightPropagationColors from "../../LightPropagationColors.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../LightPropagationButtonOptions.js";

export const CONTROL_FONT = new PhetFont(13);
export const CONTROL_TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });

/** Text on the dark panel fill (labels, checkbox text, radio text). */
export const CONTROL_TEXT_OPTIONS = {
  font: CONTROL_FONT,
  fill: LightPropagationColors.textColorProperty,
  maxWidth: 150,
} satisfies TextOptions;

/** Bold titles at the top of each panel section. */
export const CONTROL_TITLE_OPTIONS = {
  font: CONTROL_TITLE_FONT,
  fill: LightPropagationColors.textColorProperty,
  maxWidth: 180,
} satisfies TextOptions;

export const SIM_CHECKBOX_OPTIONS = {
  boxWidth: 16,
  checkboxColor: LightPropagationColors.textColorProperty,
  checkboxColorBackground: LightPropagationColors.panelBackgroundColorProperty,
} satisfies CheckboxOptions;

export const SIM_RADIO_GROUP_OPTIONS = {
  spacing: 6,
  radioButtonOptions: {
    radius: 7,
    selectedColor: LightPropagationColors.accentColorProperty,
    deselectedColor: LightPropagationColors.controlSurfaceColorProperty,
    centerColor: LightPropagationColors.panelBackgroundColorProperty,
  },
} satisfies AquaRadioButtonGroupOptions;

/**
 * NumberControl theming: dark-panel title, light number-display surface, flat
 * arrow buttons, compact slider sized for the right-hand panel stack.
 */
export const SIM_NUMBER_CONTROL_OPTIONS = {
  titleNodeOptions: {
    font: CONTROL_FONT,
    fill: LightPropagationColors.textColorProperty,
    maxWidth: 110,
  },
  numberDisplayOptions: {
    textOptions: {
      font: CONTROL_FONT,
      fill: LIGHT_SURFACE_TEXT_FILL,
    },
    backgroundFill: LightPropagationColors.controlSurfaceColorProperty,
    backgroundStroke: LightPropagationColors.panelBorderColorProperty,
  },
  sliderOptions: {
    trackSize: new Dimension2(130, 4),
    trackFillEnabled: LightPropagationColors.accentColorProperty,
    thumbSize: new Dimension2(13, 24),
  },
  arrowButtonOptions: {
    ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
  },
} satisfies NumberControlOptions;
