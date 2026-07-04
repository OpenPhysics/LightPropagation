/**
 * WaveKeyboardHelpContent.ts
 *
 * Keyboard-help dialog content shared by all four screens: slider controls,
 * a custom "Rotate 3D View" section matching WaveDisplayNode's key bindings
 * (arrows orbit, plus/minus zoom), time controls, an optional combo-box
 * section (Lab's presets menu), and basic actions.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TextKeyNode,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export type WaveKeyboardHelpContentOptions = {
  /** Adds the combo-box section (the Lab screen's presets menu). */
  includeComboBox?: boolean;
};

export class WaveKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor(options?: WaveKeyboardHelpContentOptions) {
    const keyboardHelp = StringManager.getInstance().getKeyboardHelpStrings();

    const rotateViewSection = new KeyboardHelpSection(keyboardHelp.rotateViewTitleStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        keyboardHelp.rotateViewStringProperty,
        KeyboardHelpIconFactory.arrowKeysRowIcon(),
      ),
      KeyboardHelpSectionRow.labelWithIcon(
        keyboardHelp.zoomViewStringProperty,
        KeyboardHelpIconFactory.iconOrIcon(new TextKeyNode("+"), new TextKeyNode("-")),
      ),
    ]);

    const leftSections = [new SliderControlsKeyboardHelpSection(), rotateViewSection];
    const rightSections = [
      new TimeControlsKeyboardHelpSection(),
      ...(options?.includeComboBox ? [new ComboBoxKeyboardHelpSection()] : []),
      new BasicActionsKeyboardHelpSection(),
    ];
    super(leftSections, rightSections);
  }
}
