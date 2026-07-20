/**
 * WavePlatesScreenView.ts
 *
 * The Wave Plates screen: a locked vertical + horizontal basis in the 3D
 * view with per-component amplitude and phase, and an n-only birefringent
 * slab configured either by hand or exactly via the quarter-wave / half-wave
 * plate buttons. A live readout reports the retardation in degrees and in
 * waves, and which component axis is the fast axis. Builds on
 * WaveScreenView, which owns the 3D viewport, time control, Reset All and
 * layout plumbing.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { HBox, Text, VBox } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import { RectangularPushButton } from "scenerystack/sun";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/LightPropagationButtonOptions.js";
import { LightPropagationPanel } from "../../common/LightPropagationPanel.js";
import { CONTROL_FONT, CONTROL_TEXT_OPTIONS } from "../../common/view/LightPropagationControlOptions.js";
import { MaterialControlNode } from "../../common/view/MaterialControlNode.js";
import { ThemedCheckbox } from "../../common/view/ThemedCheckbox.js";
import { ViewControlNode } from "../../common/view/ViewControlNode.js";
import { WaveControlNode } from "../../common/view/WaveControlNode.js";
import { WaveScreenView } from "../../common/view/WaveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import LightPropagationColors from "../../LightPropagationColors.js";
import { SCREEN_VIEW_MARGIN } from "../../LightPropagationConstants.js";
import type { WavePlatesModel } from "../model/WavePlatesModel.js";
import { WavePlatesScreenSummaryContent } from "./WavePlatesScreenSummaryContent.js";

export class WavePlatesScreenView extends WaveScreenView {
  public constructor(model: WavePlatesModel, options?: ScreenViewOptions) {
    const strings = StringManager.getInstance();
    const a11y = strings.getWavePlatesA11yStrings();
    const controls = strings.getControlsStrings();
    const plates = strings.getWavePlatesControlsStrings();

    super(model, {
      screenSummaryContent: new WavePlatesScreenSummaryContent(model),
      waveViewAccessibleNameProperty: a11y.waveView.accessibleNameStringProperty,
      waveViewAccessibleHelpTextProperty: a11y.waveView.accessibleHelpTextStringProperty,
      // The two-column panel stack is wider than Intro's, so push the 3D scene further left.
      viewOffset: new Vector2(-170, 0),
      ...options,
    });

    const scene = model.scene;

    // The basis is locked (wave 1 = vertical, wave 2 = horizontal), so the
    // component blocks show no polarization choices.
    const verticalControl = new WaveControlNode(scene.wave1, {
      titleStringProperty: controls.polarization.verticalStringProperty,
      titleColorProperty: LightPropagationColors.wave1ColorProperty,
      polarizationChoices: null,
      showWavelength: false,
    });

    const horizontalControl = new WaveControlNode(scene.wave2, {
      titleStringProperty: controls.polarization.horizontalStringProperty,
      titleColorProperty: LightPropagationColors.wave2ColorProperty,
      polarizationChoices: null,
      showWavelength: false,
      showPhase: true,
    });

    const sumCheckbox = new ThemedCheckbox(
      scene.sumEnabledProperty,
      new Text(controls.sumStringProperty, CONTROL_TEXT_OPTIONS),
      // The sum is only meaningful while both waves are on (the EMANIM rule).
      { enabledProperty: scene.sumAllowedProperty, accessibleName: controls.sumStringProperty },
    );

    // Exact plate presets (see WavePlatesModel for the on-grid values).
    const plateButtonEntries: Array<[typeof plates.quarterWaveStringProperty, () => void]> = [
      [plates.quarterWaveStringProperty, () => model.applyQuarterWavePlate()],
      [plates.halfWaveStringProperty, () => model.applyHalfWavePlate()],
    ];
    const plateButtons = plateButtonEntries.map(
      ([label, listener]) =>
        new RectangularPushButton({
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          content: new Text(label, { font: CONTROL_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 160 }),
          baseColor: LightPropagationColors.controlSurfaceColorProperty,
          listener,
          accessibleName: label,
        }),
    );

    const materialControl = new MaterialControlNode(scene.material, {
      titleStringProperty: controls.material.wavePlateTitleStringProperty,
      wave1LabelProperty: controls.polarization.verticalStringProperty,
      wave2LabelProperty: controls.polarization.horizontalStringProperty,
      showExtinction: false,
    });

    // Retardation readout: Δφ in degrees and in waves (Δφ/2π).
    const retardationDegreesProperty = new DerivedProperty(
      [model.retardationRadiansProperty],
      (radians) => Math.round((radians * 1800) / Math.PI) / 10,
    );
    const retardationWavesProperty = new DerivedProperty(
      [model.retardationRadiansProperty],
      (radians) => Math.round((radians / (2 * Math.PI)) * 1000) / 1000,
    );
    const retardationReadout = new Text(
      new PatternStringProperty(plates.retardationPatternStringProperty, {
        degrees: retardationDegreesProperty,
        waves: retardationWavesProperty,
      }),
      { ...CONTROL_TEXT_OPTIONS, maxWidth: 180 },
    );

    // Fast axis = the component with the lower refractive index (higher phase
    // velocity); hidden when the indices match or the plate is out.
    const material = scene.material;
    const fastAxisNameProperty = DerivedProperty.deriveAny(
      [
        material.n1Property,
        material.n2Property,
        controls.polarization.verticalStringProperty,
        controls.polarization.horizontalStringProperty,
      ],
      () =>
        material.n1Property.value < material.n2Property.value
          ? controls.polarization.verticalStringProperty.value
          : controls.polarization.horizontalStringProperty.value,
    );
    const fastAxisReadout = new Text(
      new PatternStringProperty(plates.fastAxisPatternStringProperty, { axis: fastAxisNameProperty }),
      {
        ...CONTROL_TEXT_OPTIONS,
        maxWidth: 180,
        visibleProperty: new DerivedProperty(
          [material.enabledProperty, material.n1Property, material.n2Property],
          (enabled, n1, n2) => enabled && n1 !== n2,
        ),
      },
    );

    const plateControl = new VBox({
      children: [...plateButtons, materialControl, retardationReadout, fastAxisReadout],
      spacing: 8,
      align: "left",
    });

    const viewControl = new ViewControlNode(scene, this.camera, {
      showBFieldCheckbox: false,
      showCurveCheckboxes: false,
    });

    const waveColumn = new VBox({
      children: [
        new LightPropagationPanel(verticalControl),
        new LightPropagationPanel(horizontalControl),
        new LightPropagationPanel(sumCheckbox),
      ],
      spacing: 10,
      align: "left",
    });
    const plateColumn = new VBox({
      children: [new LightPropagationPanel(plateControl), new LightPropagationPanel(viewControl)],
      spacing: 10,
      align: "left",
    });

    const panelColumns = new HBox({
      children: [waveColumn, plateColumn],
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
      ...verticalControl.interactiveNodes,
      ...horizontalControl.interactiveNodes,
      sumCheckbox,
      ...plateButtons,
      ...materialControl.interactiveNodes,
      ...viewControl.interactiveNodes,
    ]);
  }
}
