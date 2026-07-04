/**
 * LabPresetComboBox.ts
 *
 * The Lab's "Show me" preset menu: the 20 EMANIM phenomena as a flat
 * ComboBox list with category-prefixed labels (sun's ComboBox has no
 * separators), e.g. "Interference: Standing wave", plus a "Custom" entry the
 * model selects automatically after any manual edit.
 */

import { PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";
import { Text } from "scenerystack/scenery";
import { ComboBox, type ComboBoxItem } from "scenerystack/sun";
import { LIGHT_SURFACE_TEXT_FILL, SIM_COMBO_BOX_OPTIONS } from "../../common/LightPropagationButtonOptions.js";
import { CONTROL_FONT } from "../../common/view/LightPropagationControlOptions.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LabModel } from "../model/LabModel.js";
import { LAB_PRESETS, type LabPresetSelection } from "../model/LabPresets.js";

const ITEM_TEXT_OPTIONS = { font: CONTROL_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 220 };

export class LabPresetComboBox extends ComboBox<LabPresetSelection> {
  public constructor(model: LabModel, listParent: Node) {
    const presets = StringManager.getInstance().getPresetsStrings();

    const categoryLabels: Record<string, TReadOnlyProperty<string>> = {
      singleWaves: presets.categories.singleWavesStringProperty,
      superposition: presets.categories.superpositionStringProperty,
      interference: presets.categories.interferenceStringProperty,
      material: presets.categories.materialStringProperty,
      linearAnisotropy: presets.categories.linearAnisotropyStringProperty,
      circularAnisotropy: presets.categories.circularAnisotropyStringProperty,
    };
    const presetLabels: Record<string, TReadOnlyProperty<string>> = {
      vertical: presets.verticalStringProperty,
      horizontal: presets.horizontalStringProperty,
      leftCircular: presets.leftCircularStringProperty,
      rightCircular: presets.rightCircularStringProperty,
      linearPlusLinear1: presets.linearPlusLinear1StringProperty,
      linearPlusLinear2: presets.linearPlusLinear2StringProperty,
      leftPlusRightCircular: presets.leftPlusRightCircularStringProperty,
      wavelengthRatio1to1: presets.wavelengthRatio1to1StringProperty,
      wavelengthRatio1to8: presets.wavelengthRatio1to8StringProperty,
      wavelengthRatio7to8: presets.wavelengthRatio7to8StringProperty,
      standingWave: presets.standingWaveStringProperty,
      absorption: presets.absorptionStringProperty,
      refraction: presets.refractionStringProperty,
      absorptionRefraction: presets.absorptionRefractionStringProperty,
      linearDichroism: presets.linearDichroismStringProperty,
      linearBirefringence: presets.linearBirefringenceStringProperty,
      linearDichroismBirefringence: presets.linearDichroismBirefringenceStringProperty,
      circularDichroism: presets.circularDichroismStringProperty,
      circularBirefringence: presets.circularBirefringenceStringProperty,
      circularDichroismBirefringence: presets.circularDichroismBirefringenceStringProperty,
    };

    const items: ComboBoxItem<LabPresetSelection>[] = [
      {
        value: "custom",
        createNode: () => new Text(presets.customStringProperty, ITEM_TEXT_OPTIONS),
        accessibleName: presets.customStringProperty,
      },
      ...LAB_PRESETS.map((preset): ComboBoxItem<LabPresetSelection> => {
        const labelProperty = new PatternStringProperty(presets.categoryPatternStringProperty, {
          category: categoryLabels[preset.category],
          preset: presetLabels[preset.key],
        });
        return {
          value: preset.key,
          createNode: () => new Text(labelProperty, ITEM_TEXT_OPTIONS),
          accessibleName: labelProperty,
        };
      }),
    ];

    super(model.presetProperty, items, listParent, {
      ...SIM_COMBO_BOX_OPTIONS,
      accessibleName: presets.titleStringProperty,
    });
  }
}
