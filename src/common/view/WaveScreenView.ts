/**
 * WaveScreenView.ts
 *
 * Shared ScreenView base for all four screens: owns the 3D WaveDisplayNode
 * and its orbit camera, the time control (bottom, under the 3D scene), the
 * Reset All button, the WebGL context-loss dialog, and the mobius layout /
 * render-on-step plumbing (patterned on MobiusScreenView, which scenerystack
 * does not barrel-export).
 *
 * Subclasses add their control panels (typically a VBox of
 * LightPropagationPanels along the right edge) and then call
 * setScreenPdomOrder() with their interactive nodes in traversal order; the
 * base appends the 3D viewport, time control and Reset All last.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Vector2 } from "scenerystack/dot";
import { getGlobal } from "scenerystack/phet-core";
import { Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { Dialog, ScreenView } from "scenerystack/sim";
import { RectangularPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LightPropagationColors from "../../LightPropagationColors.js";
import { SCREEN_VIEW_MARGIN } from "../../LightPropagationConstants.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../LightPropagationButtonOptions.js";
import type { WaveSceneModel } from "../model/WaveSceneModel.js";
import { CONTROL_FONT } from "./LightPropagationControlOptions.js";
import { WaveDisplayNode } from "./WaveDisplayNode.js";
import { WaveSceneCamera } from "./WaveSceneCamera.js";
import { WaveTimeControlNode } from "./WaveTimeControlNode.js";

/** Shifts the 3D projection center left, clearing the right-hand panel stack. */
const DEFAULT_VIEW_OFFSET = new Vector2(-130, 0);

/** What the base class needs from a screen model. */
export type WaveScreenModel = {
  scene: WaveSceneModel;
  reset(): void;
};

export type WaveScreenViewOptions = ScreenViewOptions & {
  waveViewAccessibleNameProperty: TReadOnlyProperty<string>;
  waveViewAccessibleHelpTextProperty: TReadOnlyProperty<string>;
  /** Overrides the leftward shift of the 3D scene; screens with wider panel stacks shift further. */
  viewOffset?: Vector2;
};

export class WaveScreenView extends ScreenView {
  protected readonly camera: WaveSceneCamera;
  protected readonly waveDisplay: WaveDisplayNode;
  protected readonly timeControlNode: WaveTimeControlNode;
  protected readonly resetAllButton: ResetAllButton;

  private contextLossDialog: Dialog | null = null;

  public constructor(model: WaveScreenModel, providedOptions: WaveScreenViewOptions) {
    const { waveViewAccessibleNameProperty, waveViewAccessibleHelpTextProperty, viewOffset, ...screenViewOptions } =
      providedOptions;

    super({
      // Fitting is pointless here: most rendering happens in the three.js stage.
      preventFit: true,
      ...screenViewOptions,
    });

    const controls = StringManager.getInstance().getControlsStrings();
    const sceneOffset = viewOffset ?? DEFAULT_VIEW_OFFSET;

    this.camera = new WaveSceneCamera();
    this.waveDisplay = new WaveDisplayNode(model.scene, this.camera, this.layoutBounds, {
      viewOffset: sceneOffset,
      accessibleName: waveViewAccessibleNameProperty,
      accessibleHelpText: waveViewAccessibleHelpTextProperty,
      webglWarningStringProperty: controls.webglWarningStringProperty,
    });
    this.addChild(this.waveDisplay);

    this.waveDisplay.contextLostEmitter.addListener(() => this.showContextLossDialog());
    this.waveDisplay.contextRestoredEmitter.addListener(() => this.contextLossDialog?.hide());

    this.timeControlNode = new WaveTimeControlNode(model.scene, {
      centerX: this.layoutBounds.centerX + sceneOffset.x,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(this.timeControlNode);

    this.resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.resetView();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(this.resetAllButton);
  }

  /**
   * Registers the parallel-DOM traversal order: the subclass's controls
   * first, then the 3D viewport, time control, and Reset All.
   */
  protected setScreenPdomOrder(controlNodes: Node[]): void {
    this.addChild(
      new Node({
        pdomOrder: [...controlNodes, this.waveDisplay, this.timeControlNode, this.resetAllButton],
      }),
    );
  }

  /** Resets view-side state (the camera); model state is reset by the model. */
  protected resetView(): void {
    this.camera.reset();
  }

  private showContextLossDialog(): void {
    if (!this.contextLossDialog) {
      const controls = StringManager.getInstance().getControlsStrings();
      const content = new VBox({
        spacing: 15,
        children: [
          new Text(controls.contextLossWarningStringProperty, {
            font: new PhetFont(14),
            fill: LightPropagationColors.textColorProperty,
            maxWidth: 500,
          }),
          new RectangularPushButton({
            ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
            baseColor: LightPropagationColors.controlSurfaceColorProperty,
            content: new Text(controls.reloadStringProperty, {
              font: CONTROL_FONT,
              fill: LIGHT_SURFACE_TEXT_FILL,
            }),
            listener: () => window.location.reload(),
            accessibleName: controls.reloadStringProperty,
          }),
        ],
      });
      this.contextLossDialog = new Dialog(content, {
        fill: LightPropagationColors.panelBackgroundColorProperty,
      });
    }
    this.contextLossDialog.show();
  }

  /**
   * mobius pattern: size the three.js stage to the full window (the canvas
   * spans the whole viewport, not just the ScreenView).
   */
  public override layout(viewBounds: Bounds2): void {
    super.layout(viewBounds);
    if (!this.waveDisplay.supportsWebGL) {
      return;
    }
    const sim = getGlobal("phet.joist.sim") as
      | { dimensionProperty?: { value: { width: number; height: number } } }
      | undefined;
    const width = sim?.dimensionProperty?.value.width || window.innerWidth;
    const height = sim?.dimensionProperty?.value.height || window.innerHeight;
    this.waveDisplay.layoutStage(width, height);
    // An initial render is required for layout-dependent code.
    this.waveDisplay.render();
  }

  /** Renders the 3D scene each frame (the model has already stepped). */
  public override step(_dt: number): void {
    this.waveDisplay.render();
  }
}
