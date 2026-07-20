/**
 * PolarizationScreenView.ts
 *
 * The Polarization screen: two always-on waves in the 3D view with per-wave
 * polarization and amplitude, a shared wavelength, wave 2's phase difference,
 * a sum checkbox, and a κ-only material presented as a polarizer (dichroic
 * filter). Builds on WaveScreenView, which owns the 3D viewport, time
 * control, Reset All and layout plumbing.
 *
 * The panels form two columns along the right edge: waves on the left column,
 * shared wave settings / polarizer / view on the right.
 */

import { Vector2 } from "scenerystack/dot";
import { HBox, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { LightPropagationPanel } from "../../common/LightPropagationPanel.js";
import { CONTROL_TEXT_OPTIONS, SIM_NUMBER_CONTROL_OPTIONS } from "../../common/view/LightPropagationControlOptions.js";
import { MaterialControlNode } from "../../common/view/MaterialControlNode.js";
import { ThemedCheckbox } from "../../common/view/ThemedCheckbox.js";
import { ViewControlNode } from "../../common/view/ViewControlNode.js";
import { WaveControlNode } from "../../common/view/WaveControlNode.js";
import { WaveScreenView } from "../../common/view/WaveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import LightPropagationColors from "../../LightPropagationColors.js";
import { SCREEN_VIEW_MARGIN, WAVELENGTH_NUMBER_RANGE } from "../../LightPropagationConstants.js";
import type { PolarizationModel } from "../model/PolarizationModel.js";
import { PolarizationScreenSummaryContent } from "./PolarizationScreenSummaryContent.js";

export class PolarizationScreenView extends WaveScreenView {
  public constructor(model: PolarizationModel, options?: ScreenViewOptions) {
    const strings = StringManager.getInstance();
    const a11y = strings.getPolarizationA11yStrings();
    const common = strings.getCommonA11yStrings();
    const controls = strings.getControlsStrings();

    super(model, {
      screenSummaryContent: new PolarizationScreenSummaryContent(model),
      waveViewAccessibleNameProperty: a11y.waveView.accessibleNameStringProperty,
      waveViewAccessibleHelpTextProperty: a11y.waveView.accessibleHelpTextStringProperty,
      // The two-column panel stack is wider than Intro's, so push the 3D scene further left.
      viewOffset: new Vector2(-170, 0),
      ...options,
    });

    const scene = model.scene;

    const wave1Control = new WaveControlNode(scene.wave1, {
      titleStringProperty: controls.wave1StringProperty,
      titleColorProperty: LightPropagationColors.wave1ColorProperty,
      showWavelength: false,
      accessibleNames: {},
    });

    const wave2Control = new WaveControlNode(scene.wave2, {
      titleStringProperty: controls.wave2StringProperty,
      titleColorProperty: LightPropagationColors.wave2ColorProperty,
      showWavelength: false,
      showPhase: true,
      accessibleNames: {},
    });

    // Both waves share one wavelength; the model keeps wave 2 in sync.
    const wavelengthControl = new NumberControl(
      controls.wavelengthStringProperty,
      scene.wave1.wavelengthNumberProperty,
      WAVELENGTH_NUMBER_RANGE,
      {
        ...SIM_NUMBER_CONTROL_OPTIONS,
        delta: 1,
        sliderOptions: {
          ...SIM_NUMBER_CONTROL_OPTIONS.sliderOptions,
          constrainValue: (value: number) => Math.round(value),
        },
        accessibleName: controls.wavelengthStringProperty,
      },
    );

    const sumCheckbox = new ThemedCheckbox(
      scene.sumEnabledProperty,
      new Text(controls.sumStringProperty, CONTROL_TEXT_OPTIONS),
      // The sum is only meaningful while both waves are on (the EMANIM rule).
      { enabledProperty: scene.sumAllowedProperty, accessibleName: controls.sumStringProperty },
    );

    const sharedWaveControl = new VBox({
      children: [wavelengthControl, sumCheckbox],
      spacing: 8,
      align: "left",
    });

    const materialControl = new MaterialControlNode(scene.material, {
      titleStringProperty: controls.material.polarizerTitleStringProperty,
      showRefractiveIndex: false,
    });

    const viewControl = new ViewControlNode(scene, this.camera, {
      showBFieldCheckbox: false,
      showCurveCheckboxes: false,
      accessibleNames: {
        presets: {
          nice: common.cameraPresets.niceStringProperty,
          side: common.cameraPresets.sideStringProperty,
          front: common.cameraPresets.frontStringProperty,
          back: common.cameraPresets.backStringProperty,
        },
      },
    });

    const waveColumn = new VBox({
      children: [new LightPropagationPanel(wave1Control), new LightPropagationPanel(wave2Control)],
      spacing: 10,
      align: "left",
    });
    const settingsColumn = new VBox({
      children: [
        new LightPropagationPanel(sharedWaveControl),
        new LightPropagationPanel(materialControl),
        new LightPropagationPanel(viewControl),
      ],
      spacing: 10,
      align: "left",
    });

    const panelColumns = new HBox({
      children: [waveColumn, settingsColumn],
      spacing: 10,
      align: "top",
      // Scales the whole control surface down if a locale's strings make it
      // taller than the screen.
      maxHeight: this.layoutBounds.height - 2 * SCREEN_VIEW_MARGIN,
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      top: this.layoutBounds.minY + SCREEN_VIEW_MARGIN,
    });
    this.addChild(panelColumns);

    this.setScreenPdomOrder([
      ...wave1Control.interactiveNodes,
      ...wave2Control.interactiveNodes,
      wavelengthControl,
      sumCheckbox,
      ...materialControl.interactiveNodes,
      ...viewControl.interactiveNodes,
    ]);
  }
}
