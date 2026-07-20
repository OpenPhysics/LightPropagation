/**
 * WaveControlNode.ts
 *
 * The control block for one wave: optional enable checkbox, polarization
 * radio group, amplitude/wavelength/phase NumberControls and a
 * reverse-direction checkbox. Options select which rows appear, so each
 * screen shows exactly the controls it teaches. Wrap the result in a
 * LightPropagationPanel (or stack several blocks inside one panel).
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { type Node, type ProfileColorProperty, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import {
  AMPLITUDE_RANGE,
  PHASE_DEGREES_RANGE,
  PHASE_DEGREES_STEP,
  WAVELENGTH_NUMBER_RANGE,
} from "../../LightPropagationConstants.js";
import type { EMWave } from "../model/EMWave.js";
import type { PolarizationType } from "../model/PolarizationType.js";
import { PolarizationTypeValues } from "../model/PolarizationType.js";
import {
  CONTROL_TEXT_OPTIONS,
  CONTROL_TITLE_FONT,
  SIM_NUMBER_CONTROL_OPTIONS,
  SIM_RADIO_GROUP_OPTIONS,
} from "./LightPropagationControlOptions.js";
import { scopedNameProperty } from "./summaryPhrases.js";
import { ThemedCheckbox } from "./ThemedCheckbox.js";

export type WaveControlNodeOptions = {
  /** The wave's title ("Wave 1" / "Wave 2"); tinted with the wave's color. */
  titleStringProperty: TReadOnlyProperty<string>;
  /** Colors the title so the block visually matches its curve. */
  titleColorProperty: ProfileColorProperty;
  /**
   * a11y name overrides, keyed per control; rows default to their visible
   * label scoped by the block title ("Amplitude, Wave 1").
   */
  accessibleNames?: {
    enabled?: TReadOnlyProperty<string>;
    polarization?: TReadOnlyProperty<string>;
    amplitude?: TReadOnlyProperty<string>;
    wavelength?: TReadOnlyProperty<string>;
    phase?: TReadOnlyProperty<string>;
    reverse?: TReadOnlyProperty<string>;
  };
  showEnabledCheckbox?: boolean;
  /** Which polarization choices to offer (default: all four). */
  polarizationChoices?: readonly PolarizationType[] | null;
  showAmplitude?: boolean;
  showWavelength?: boolean;
  showPhase?: boolean;
  showReverse?: boolean;
};

export class WaveControlNode extends VBox {
  /** Interactive children in traversal order, for the screen's pdomOrder. */
  public readonly interactiveNodes: Node[] = [];

  public constructor(wave: EMWave, providedOptions: WaveControlNodeOptions) {
    const options = {
      accessibleNames: {},
      showEnabledCheckbox: false,
      polarizationChoices: PolarizationTypeValues,
      showAmplitude: true,
      showWavelength: true,
      showPhase: false,
      showReverse: false,
      ...providedOptions,
    };
    const controls = StringManager.getInstance().getControlsStrings();
    const children: Node[] = [];
    const interactiveNodes: Node[] = [];

    // Default accessible names are scoped by the block title ("Amplitude,
    // Wave 1"), since the same controls repeat once per wave on most screens.
    const scoped = (labelProperty: TReadOnlyProperty<string>): TReadOnlyProperty<string> =>
      scopedNameProperty(labelProperty, options.titleStringProperty);

    const title = new Text(options.titleStringProperty, {
      font: CONTROL_TITLE_FONT,
      fill: options.titleColorProperty,
      maxWidth: 180,
    });

    if (options.showEnabledCheckbox) {
      const checkbox = new ThemedCheckbox(wave.enabledProperty, title, {
        accessibleName: options.accessibleNames.enabled ?? options.titleStringProperty,
      });
      children.push(checkbox);
      interactiveNodes.push(checkbox);
    } else {
      children.push(title);
    }

    if (options.polarizationChoices && options.polarizationChoices.length > 1) {
      const polarizationLabels: Record<PolarizationType, TReadOnlyProperty<string>> = {
        vertical: controls.polarization.verticalStringProperty,
        horizontal: controls.polarization.horizontalStringProperty,
        leftCircular: controls.polarization.leftCircularStringProperty,
        rightCircular: controls.polarization.rightCircularStringProperty,
      };
      const radioGroup = new VerticalAquaRadioButtonGroup(
        wave.polarizationProperty,
        options.polarizationChoices.map((value) => ({
          value,
          createNode: () => new Text(polarizationLabels[value], CONTROL_TEXT_OPTIONS),
          options: { accessibleName: polarizationLabels[value] },
        })),
        {
          ...SIM_RADIO_GROUP_OPTIONS,
          accessibleName: options.accessibleNames.polarization ?? scoped(controls.polarization.titleStringProperty),
        },
      );
      children.push(radioGroup);
      interactiveNodes.push(radioGroup);
    }

    if (options.showAmplitude) {
      const amplitudeControl = new NumberControl(
        controls.amplitudeStringProperty,
        wave.amplitudeProperty,
        AMPLITUDE_RANGE,
        {
          ...SIM_NUMBER_CONTROL_OPTIONS,
          delta: 1,
          sliderOptions: {
            ...SIM_NUMBER_CONTROL_OPTIONS.sliderOptions,
            constrainValue: (value: number) => Math.round(value),
          },
          accessibleName: options.accessibleNames.amplitude ?? scoped(controls.amplitudeStringProperty),
        },
      );
      children.push(amplitudeControl);
      interactiveNodes.push(amplitudeControl);
    }

    if (options.showWavelength) {
      const wavelengthControl = new NumberControl(
        controls.wavelengthStringProperty,
        wave.wavelengthNumberProperty,
        WAVELENGTH_NUMBER_RANGE,
        {
          ...SIM_NUMBER_CONTROL_OPTIONS,
          delta: 1,
          sliderOptions: {
            ...SIM_NUMBER_CONTROL_OPTIONS.sliderOptions,
            constrainValue: (value: number) => Math.round(value),
          },
          accessibleName: options.accessibleNames.wavelength ?? scoped(controls.wavelengthStringProperty),
        },
      );
      children.push(wavelengthControl);
      interactiveNodes.push(wavelengthControl);
    }

    if (options.showPhase) {
      const phaseControl = new NumberControl(
        controls.phaseDifferenceStringProperty,
        wave.phaseDegreesProperty,
        PHASE_DEGREES_RANGE,
        {
          ...SIM_NUMBER_CONTROL_OPTIONS,
          delta: PHASE_DEGREES_STEP,
          numberDisplayOptions: {
            ...SIM_NUMBER_CONTROL_OPTIONS.numberDisplayOptions,
            valuePattern: controls.degreesPatternStringProperty,
          },
          sliderOptions: {
            ...SIM_NUMBER_CONTROL_OPTIONS.sliderOptions,
            constrainValue: (value: number) => Math.round(value / PHASE_DEGREES_STEP) * PHASE_DEGREES_STEP,
          },
          accessibleName: options.accessibleNames.phase ?? scoped(controls.phaseDifferenceStringProperty),
        },
      );
      children.push(phaseControl);
      interactiveNodes.push(phaseControl);
    }

    if (options.showReverse) {
      const reverseCheckbox = new ThemedCheckbox(
        wave.reversedProperty,
        new Text(controls.reverseDirectionStringProperty, CONTROL_TEXT_OPTIONS),
        { accessibleName: options.accessibleNames.reverse ?? scoped(controls.reverseDirectionStringProperty) },
      );
      children.push(reverseCheckbox);
      interactiveNodes.push(reverseCheckbox);
    }

    super({
      children,
      spacing: 8,
      align: "left",
    });
    this.interactiveNodes.push(...interactiveNodes);
  }
}
