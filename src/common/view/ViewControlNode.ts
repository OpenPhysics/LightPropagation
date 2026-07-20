/**
 * ViewControlNode.ts
 *
 * Camera and display controls: the four camera-preset buttons (Nice / Side /
 * Front / Back), a parallel-projection checkbox, and optional display
 * toggles (E-field vectors, magnetic field, wave curves, sum curve). Options
 * select which toggles appear per screen.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { RectangularPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LightPropagationColors from "../../LightPropagationColors.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../LightPropagationButtonOptions.js";
import type { WaveSceneModel } from "../model/WaveSceneModel.js";
import { CONTROL_FONT, CONTROL_TEXT_OPTIONS, CONTROL_TITLE_OPTIONS } from "./LightPropagationControlOptions.js";
import { ThemedCheckbox } from "./ThemedCheckbox.js";
import type { CameraPreset, WaveSceneCamera } from "./WaveSceneCamera.js";

export type ViewControlNodeOptions = {
  /**
   * a11y name overrides for the rows that are shown. Camera-preset buttons
   * default to the shared a11y.common.cameraPresets strings, every other row
   * to its visible label.
   */
  accessibleNames?: {
    presets?: Partial<Record<CameraPreset, TReadOnlyProperty<string>>>;
    parallelProjection?: TReadOnlyProperty<string>;
    eVectors?: TReadOnlyProperty<string>;
    bField?: TReadOnlyProperty<string>;
    componentCurves?: TReadOnlyProperty<string>;
    sumCurve?: TReadOnlyProperty<string>;
  };
  showBFieldCheckbox?: boolean;
  showCurveCheckboxes?: boolean;
  showSumCurveCheckbox?: boolean;
};

export class ViewControlNode extends VBox {
  /** Interactive children in traversal order, for the screen's pdomOrder. */
  public readonly interactiveNodes: Node[] = [];

  public constructor(model: WaveSceneModel, camera: WaveSceneCamera, providedOptions?: ViewControlNodeOptions) {
    const options = {
      accessibleNames: {},
      showBFieldCheckbox: true,
      showCurveCheckboxes: true,
      showSumCurveCheckbox: false,
      ...providedOptions,
    };
    const strings = StringManager.getInstance();
    const controls = strings.getControlsStrings();
    const commonA11y = strings.getCommonA11yStrings();
    const children: Node[] = [];
    const interactiveNodes: Node[] = [];

    children.push(new Text(controls.views.titleStringProperty, CONTROL_TITLE_OPTIONS));

    // Visible label and default accessible name per camera preset; the terse
    // button labels ("Nice") get the more descriptive shared a11y names.
    const presetEntries: Array<[CameraPreset, TReadOnlyProperty<string>, TReadOnlyProperty<string>]> = [
      ["nice", controls.views.niceStringProperty, commonA11y.cameraPresets.niceStringProperty],
      ["side", controls.views.sideStringProperty, commonA11y.cameraPresets.sideStringProperty],
      ["front", controls.views.frontStringProperty, commonA11y.cameraPresets.frontStringProperty],
      ["back", controls.views.backStringProperty, commonA11y.cameraPresets.backStringProperty],
    ];
    const presetButtons = presetEntries.map(
      ([preset, label, defaultAccessibleName]) =>
        new RectangularPushButton({
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          content: new Text(label, { font: CONTROL_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 60 }),
          baseColor: LightPropagationColors.controlSurfaceColorProperty,
          listener: () => camera.setPreset(preset),
          accessibleName: options.accessibleNames.presets?.[preset] ?? defaultAccessibleName,
        }),
    );
    // 2×2 grid of preset buttons.
    const presetGrid = new VBox({
      children: [
        new HBox({ children: presetButtons.slice(0, 2), spacing: 6 }),
        new HBox({ children: presetButtons.slice(2), spacing: 6 }),
      ],
      spacing: 6,
      align: "left",
    });
    children.push(presetGrid);
    interactiveNodes.push(...presetButtons);

    const parallelCheckbox = new ThemedCheckbox(
      camera.parallelProjectionProperty,
      new Text(controls.views.parallelProjectionStringProperty, CONTROL_TEXT_OPTIONS),
      { accessibleName: options.accessibleNames.parallelProjection ?? controls.views.parallelProjectionStringProperty },
    );
    children.push(parallelCheckbox);
    interactiveNodes.push(parallelCheckbox);

    const eVectorsCheckbox = new ThemedCheckbox(
      model.eVectorsVisibleProperty,
      new Text(controls.display.electricFieldVectorsStringProperty, CONTROL_TEXT_OPTIONS),
      { accessibleName: options.accessibleNames.eVectors ?? controls.display.electricFieldVectorsStringProperty },
    );
    children.push(eVectorsCheckbox);
    interactiveNodes.push(eVectorsCheckbox);

    if (options.showBFieldCheckbox) {
      const bFieldCheckbox = new ThemedCheckbox(
        model.bFieldVisibleProperty,
        new Text(controls.display.magneticFieldStringProperty, CONTROL_TEXT_OPTIONS),
        { accessibleName: options.accessibleNames.bField ?? controls.display.magneticFieldStringProperty },
      );
      children.push(bFieldCheckbox);
      interactiveNodes.push(bFieldCheckbox);
    }

    if (options.showCurveCheckboxes) {
      const curvesCheckbox = new ThemedCheckbox(
        model.componentCurvesVisibleProperty,
        new Text(controls.display.componentCurvesStringProperty, CONTROL_TEXT_OPTIONS),
        { accessibleName: options.accessibleNames.componentCurves ?? controls.display.componentCurvesStringProperty },
      );
      children.push(curvesCheckbox);
      interactiveNodes.push(curvesCheckbox);
    }

    if (options.showSumCurveCheckbox) {
      const sumCurveCheckbox = new ThemedCheckbox(
        model.sumCurveVisibleProperty,
        new Text(controls.display.sumCurveStringProperty, CONTROL_TEXT_OPTIONS),
        { accessibleName: options.accessibleNames.sumCurve ?? controls.display.sumCurveStringProperty },
      );
      children.push(sumCurveCheckbox);
      interactiveNodes.push(sumCurveCheckbox);
    }

    super({
      children,
      spacing: 8,
      align: "left",
    });
    this.interactiveNodes.push(...interactiveNodes);
  }
}
