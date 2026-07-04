/**
 * LabScreenView.ts
 *
 * The Lab screen: full EMANIM parity. A "Show me" preset menu over 20
 * phenomena, complete per-wave controls (enable, polarization, amplitude,
 * independent wavelength, phase, reverse direction), the full material
 * (n and κ per wave plus "same as wave 1"), and every display toggle
 * including the magnetic field. Builds on WaveScreenView, which owns the 3D
 * viewport, time control, Reset All and layout plumbing.
 */

import { BooleanProperty, stepTimer } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { HBox, Text, VBox } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import { RectangularPushButton } from "scenerystack/sun";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/LightPropagationButtonOptions.js";
import { LightPropagationPanel } from "../../common/LightPropagationPanel.js";
import {
  CONTROL_FONT,
  CONTROL_TEXT_OPTIONS,
  CONTROL_TITLE_OPTIONS,
} from "../../common/view/LightPropagationControlOptions.js";
import { MaterialControlNode } from "../../common/view/MaterialControlNode.js";
import { booleanPhraseProperty } from "../../common/view/summaryPhrases.js";
import { ThemedCheckbox } from "../../common/view/ThemedCheckbox.js";
import { ViewControlNode } from "../../common/view/ViewControlNode.js";
import { WaveControlNode } from "../../common/view/WaveControlNode.js";
import { WaveScreenView } from "../../common/view/WaveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import LightPropagationColors from "../../LightPropagationColors.js";
import { SCREEN_VIEW_MARGIN } from "../../LightPropagationConstants.js";
import type { LabModel } from "../model/LabModel.js";
import { queryStringFromState } from "../model/labQueryParameterMapping.js";
import { LabPresetComboBox } from "./LabPresetComboBox.js";
import { LabScreenSummaryContent } from "./LabScreenSummaryContent.js";

export class LabScreenView extends WaveScreenView {
  public constructor(model: LabModel, options?: ScreenViewOptions) {
    const strings = StringManager.getInstance();
    const a11y = strings.getLabA11yStrings();
    const common = strings.getCommonA11yStrings();
    const controls = strings.getControlsStrings();
    const presets = strings.getPresetsStrings();

    super(model, {
      screenSummaryContent: new LabScreenSummaryContent(model),
      waveViewAccessibleNameProperty: a11y.waveView.accessibleNameStringProperty,
      waveViewAccessibleHelpTextProperty: a11y.waveView.accessibleHelpTextStringProperty,
      // The two-column panel stack is wider than Intro's, so push the 3D scene further left.
      viewOffset: new Vector2(-170, 0),
      ...options,
    });

    const scene = model.scene;

    const presetComboBox = new LabPresetComboBox(model, this);
    const presetControl = new VBox({
      children: [new Text(presets.titleStringProperty, CONTROL_TITLE_OPTIONS), presetComboBox],
      spacing: 6,
      align: "left",
    });

    const wave1Control = new WaveControlNode(scene.wave1, {
      titleStringProperty: controls.wave1StringProperty,
      titleColorProperty: LightPropagationColors.wave1ColorProperty,
      showEnabledCheckbox: true,
      showReverse: true,
      accessibleNames: {},
    });

    const wave2Control = new WaveControlNode(scene.wave2, {
      titleStringProperty: controls.wave2StringProperty,
      titleColorProperty: LightPropagationColors.wave2ColorProperty,
      showEnabledCheckbox: true,
      showPhase: true,
      accessibleNames: {},
    });

    const sumCheckbox = new ThemedCheckbox(
      scene.sumEnabledProperty,
      new Text(controls.sumStringProperty, CONTROL_TEXT_OPTIONS),
      { accessibleName: controls.sumStringProperty },
    );

    const materialControl = new MaterialControlNode(scene.material, {
      showSameAsWave1: true,
    });

    const viewControl = new ViewControlNode(scene, this.camera, {
      showSumCurveCheckbox: true,
      accessibleNames: {
        presets: {
          nice: common.cameraPresets.niceStringProperty,
          side: common.cameraPresets.sideStringProperty,
          front: common.cameraPresets.frontStringProperty,
          back: common.cameraPresets.backStringProperty,
        },
      },
    });

    // "Copy link": puts a permalink for the current configuration on the
    // clipboard; the label flips to a brief confirmation.
    const linkCopiedProperty = new BooleanProperty(false);
    const copyLinkButton = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      content: new Text(
        booleanPhraseProperty(linkCopiedProperty, controls.linkCopiedStringProperty, controls.copyLinkStringProperty),
        { font: CONTROL_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 140 },
      ),
      baseColor: LightPropagationColors.controlSurfaceColorProperty,
      listener: () => {
        const query = queryStringFromState(scene.getState());
        const url = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
        navigator.clipboard?.writeText(url).then(() => {
          linkCopiedProperty.value = true;
          stepTimer.setTimeout(() => {
            linkCopiedProperty.value = false;
          }, 2000);
        });
      },
      accessibleName: controls.copyLinkStringProperty,
    });

    const waveColumn = new VBox({
      children: [
        new LightPropagationPanel(presetControl),
        new LightPropagationPanel(wave1Control),
        new LightPropagationPanel(wave2Control),
      ],
      spacing: 8,
      align: "left",
    });
    const settingsColumn = new VBox({
      children: [
        new LightPropagationPanel(sumCheckbox),
        new LightPropagationPanel(materialControl),
        new LightPropagationPanel(viewControl),
        copyLinkButton,
      ],
      spacing: 8,
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
      presetComboBox,
      ...wave1Control.interactiveNodes,
      ...wave2Control.interactiveNodes,
      sumCheckbox,
      ...materialControl.interactiveNodes,
      ...viewControl.interactiveNodes,
      copyLinkButton,
    ]);
  }
}
