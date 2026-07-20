/**
 * MaterialControlNode.ts
 *
 * The control block for the material slab: an insert checkbox (labeled with a
 * screen-appropriate title such as "Polarizer" or "Wave plate"), a length
 * control, per-wave refractive-index and extinction controls, and an optional
 * "same as wave 1" coupling checkbox. Options select which rows appear, so
 * the Polarization screen shows κ only, Wave Plates shows n only, and the
 * Lab shows everything. Wrap the result in a LightPropagationPanel.
 *
 * All rows below the insert checkbox are disabled while the material is out
 * of the scene.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { type Node, type ProfileColorProperty, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import LightPropagationColors from "../../LightPropagationColors.js";
import {
  EXTINCTION_RANGE,
  INDEX_STEP,
  MATERIAL_LENGTH_RANGE,
  REFRACTIVE_INDEX_RANGE,
} from "../../LightPropagationConstants.js";
import type { OpticalMaterial } from "../model/OpticalMaterial.js";
import {
  CONTROL_TEXT_OPTIONS,
  CONTROL_TITLE_FONT,
  SIM_NUMBER_CONTROL_OPTIONS,
} from "./LightPropagationControlOptions.js";
import { scopedNameProperty } from "./summaryPhrases.js";
import { ThemedCheckbox } from "./ThemedCheckbox.js";

const WAVE_LABEL_FONT = new PhetFont({ size: 13, weight: "bold" });

export type MaterialControlNodeOptions = {
  /** Panel title used as the insert checkbox's label (default: "Material"). */
  titleStringProperty?: TReadOnlyProperty<string>;
  /** Per-wave subtitle labels (default: "Wave 1" / "Wave 2"). */
  wave1LabelProperty?: TReadOnlyProperty<string>;
  wave2LabelProperty?: TReadOnlyProperty<string>;
  showRefractiveIndex?: boolean;
  showExtinction?: boolean;
  showSameAsWave1?: boolean;
};

export class MaterialControlNode extends VBox {
  /** Interactive children in traversal order, for the screen's pdomOrder. */
  public readonly interactiveNodes: Node[] = [];

  public constructor(material: OpticalMaterial, providedOptions?: MaterialControlNodeOptions) {
    const controls = StringManager.getInstance().getControlsStrings();
    const options = {
      titleStringProperty: controls.material.titleStringProperty,
      wave1LabelProperty: controls.wave1StringProperty,
      wave2LabelProperty: controls.wave2StringProperty,
      showRefractiveIndex: true,
      showExtinction: true,
      showSameAsWave1: false,
      ...providedOptions,
    };
    const children: Node[] = [];
    const interactiveNodes: Node[] = [];
    const enabledProperty = material.enabledProperty;

    const insertCheckbox = new ThemedCheckbox(
      material.enabledProperty,
      new Text(options.titleStringProperty, {
        font: CONTROL_TITLE_FONT,
        fill: LightPropagationColors.textColorProperty,
        maxWidth: 180,
      }),
      { accessibleName: controls.material.insertStringProperty },
    );
    children.push(insertCheckbox);
    interactiveNodes.push(insertCheckbox);

    const lengthControl = new NumberControl(
      controls.material.lengthStringProperty,
      material.lengthNumberProperty,
      MATERIAL_LENGTH_RANGE,
      {
        ...SIM_NUMBER_CONTROL_OPTIONS,
        delta: 1,
        sliderOptions: {
          ...SIM_NUMBER_CONTROL_OPTIONS.sliderOptions,
          constrainValue: (value: number) => Math.round(value),
        },
        enabledProperty,
        accessibleName: controls.material.lengthStringProperty,
      },
    );
    children.push(lengthControl);
    interactiveNodes.push(lengthControl);

    // Per-wave n/κ rows, each group headed by a wave-colored subtitle.
    const waveRows: Array<{
      labelProperty: TReadOnlyProperty<string>;
      colorProperty: ProfileColorProperty;
      nProperty: typeof material.n1Property;
      kappaProperty: typeof material.kappa1Property;
    }> = [
      {
        labelProperty: options.wave1LabelProperty,
        colorProperty: LightPropagationColors.wave1ColorProperty,
        nProperty: material.n1Property,
        kappaProperty: material.kappa1Property,
      },
      {
        labelProperty: options.wave2LabelProperty,
        colorProperty: LightPropagationColors.wave2ColorProperty,
        nProperty: material.n2Property,
        kappaProperty: material.kappa2Property,
      },
    ];

    // Snaps to the shared 0.05 step without accumulating float drift.
    const constrainIndexValue = (value: number): number => Math.round(value / INDEX_STEP) * INDEX_STEP;
    const indexControlOptions = {
      ...SIM_NUMBER_CONTROL_OPTIONS,
      delta: INDEX_STEP,
      numberDisplayOptions: {
        ...SIM_NUMBER_CONTROL_OPTIONS.numberDisplayOptions,
        decimalPlaces: 2,
      },
      sliderOptions: {
        ...SIM_NUMBER_CONTROL_OPTIONS.sliderOptions,
        constrainValue: constrainIndexValue,
      },
      enabledProperty,
    };

    if (options.showRefractiveIndex || options.showExtinction) {
      for (const row of waveRows) {
        children.push(new Text(row.labelProperty, { font: WAVE_LABEL_FONT, fill: row.colorProperty, maxWidth: 150 }));
        if (options.showRefractiveIndex) {
          const nControl = new NumberControl(
            controls.material.refractiveIndexStringProperty,
            row.nProperty,
            REFRACTIVE_INDEX_RANGE,
            {
              ...indexControlOptions,
              accessibleName: scopedNameProperty(controls.material.refractiveIndexStringProperty, row.labelProperty),
            },
          );
          children.push(nControl);
          interactiveNodes.push(nControl);
        }
        if (options.showExtinction) {
          const kappaControl = new NumberControl(
            controls.material.extinctionStringProperty,
            row.kappaProperty,
            EXTINCTION_RANGE,
            {
              ...indexControlOptions,
              accessibleName: scopedNameProperty(controls.material.extinctionStringProperty, row.labelProperty),
            },
          );
          children.push(kappaControl);
          interactiveNodes.push(kappaControl);
        }
      }
    }

    if (options.showSameAsWave1) {
      const sameCheckbox = new ThemedCheckbox(
        material.sameAsWave1Property,
        new Text(controls.material.sameAsWave1StringProperty, CONTROL_TEXT_OPTIONS),
        { enabledProperty, accessibleName: controls.material.sameAsWave1StringProperty },
      );
      children.push(sameCheckbox);
      interactiveNodes.push(sameCheckbox);
    }

    super({
      children,
      spacing: 8,
      align: "left",
    });
    this.interactiveNodes.push(...interactiveNodes);
  }
}
