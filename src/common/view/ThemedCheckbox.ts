/**
 * ThemedCheckbox.ts
 *
 * A Checkbox pre-themed with the sim's colors (box stroke follows the text
 * color, fill follows the panel background), so default/projector switching
 * is automatic. Use for every checkbox in the sim.
 */

import type { Property } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";
import type { CheckboxOptions } from "scenerystack/sun";
import { Checkbox } from "scenerystack/sun";
import { SIM_CHECKBOX_OPTIONS } from "./LightPropagationControlOptions.js";

export class ThemedCheckbox extends Checkbox {
  public constructor(property: Property<boolean>, content: Node, providedOptions?: CheckboxOptions) {
    super(property, content, {
      ...SIM_CHECKBOX_OPTIONS,
      ...providedOptions,
    });
  }
}
