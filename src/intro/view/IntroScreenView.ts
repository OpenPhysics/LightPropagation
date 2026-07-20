/**
 * IntroScreenView.ts
 *
 * The Intro screen: one wave in the 3D view, with controls for polarization,
 * amplitude and wavelength, plus the shared view/display controls. Builds on
 * WaveScreenView, which owns the 3D viewport, time control, Reset All and
 * layout plumbing.
 */

import { VBox } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import { LightPropagationPanel } from "../../common/LightPropagationPanel.js";
import { ViewControlNode } from "../../common/view/ViewControlNode.js";
import { WaveControlNode } from "../../common/view/WaveControlNode.js";
import { WaveScreenView } from "../../common/view/WaveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import LightPropagationColors from "../../LightPropagationColors.js";
import { SCREEN_VIEW_MARGIN } from "../../LightPropagationConstants.js";
import type { IntroModel } from "../model/IntroModel.js";
import { IntroScreenSummaryContent } from "./IntroScreenSummaryContent.js";

export class IntroScreenView extends WaveScreenView {
  public constructor(model: IntroModel, options?: ScreenViewOptions) {
    const strings = StringManager.getInstance();
    const a11y = strings.getIntroA11yStrings();
    const controls = strings.getControlsStrings();

    super(model, {
      screenSummaryContent: new IntroScreenSummaryContent(model),
      waveViewAccessibleNameProperty: a11y.waveView.accessibleNameStringProperty,
      waveViewAccessibleHelpTextProperty: a11y.waveView.accessibleHelpTextStringProperty,
      ...options,
    });

    const waveControl = new WaveControlNode(model.scene.wave1, {
      titleStringProperty: controls.wave1StringProperty,
      titleColorProperty: LightPropagationColors.wave1ColorProperty,
    });

    const viewControl = new ViewControlNode(model.scene, this.camera);

    const panelStack = new VBox({
      children: [new LightPropagationPanel(waveControl), new LightPropagationPanel(viewControl)],
      spacing: 10,
      align: "right",
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      top: this.layoutBounds.minY + SCREEN_VIEW_MARGIN,
    });
    this.addChild(panelStack);

    this.setScreenPdomOrder([...waveControl.interactiveNodes, ...viewControl.interactiveNodes]);
  }
}
