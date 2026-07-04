/**
 * LabKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * The Lab adds a presets combo box on top of the shared slider / 3D-view /
 * time-control interactions.
 */

import { WaveKeyboardHelpContent } from "../../common/view/WaveKeyboardHelpContent.js";

export class LabKeyboardHelpContent extends WaveKeyboardHelpContent {
  public constructor() {
    super({ includeComboBox: true });
  }
}
