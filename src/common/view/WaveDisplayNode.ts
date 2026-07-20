/**
 * WaveDisplayNode.ts
 *
 * The 3D wave viewport — the only file that imports scenerystack/mobius.
 * Renders the propagation axis, transverse end frames, the two wave curves,
 * their superposition, optional magnetic-field curves, E-vector end arrows
 * with construction lines, and the material slab, all inside a mobius
 * ThreeIsometricNode (patterned on MobiusScreenView, which is not
 * barrel-exported).
 *
 * three API notes (three 0.185 via the threeCompat shims):
 *   - curves are THREE.Line over BufferGeometry/BufferAttribute with
 *     DynamicDrawUsage; positions are rewritten each frame straight from
 *     FieldSampler's buffers, and geometry is never rebuilt;
 *   - frustumCulled = false everywhere dynamic (bounds are never recomputed);
 *   - the material wirebox is a unit-length box scaled in x, never rebuilt;
 *   - colors follow LightPropagationColors via ThreeUtils.colorToThree links.
 *
 * Interaction: pointer drag orbits, mouse wheel zooms, and the node itself is
 * a focusable div where arrow keys orbit and plus/minus zoom.
 *
 * If WebGL is unavailable, shows a localized warning instead (and
 * `stage.threeRenderer === null` after a failed renderer creation degrades to
 * an empty-but-stable node). Context loss is surfaced through
 * `contextLostEmitter`/`contextRestoredEmitter` for the ScreenView's dialog.
 */

import type { TEmitter, TReadOnlyProperty } from "scenerystack/axon";
import { TinyEmitter } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Vector2 } from "scenerystack/dot";
import { THREE, ThreeIsometricNode, ThreeUtils } from "scenerystack/mobius";
import type { Color, ProfileColorProperty } from "scenerystack/scenery";
import { DragListener, KeyboardListener, Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import LightPropagationColors from "../../LightPropagationColors.js";
import {
  CAMERA_FOV_DEGREES,
  MATERIAL_CROSS_SECTION,
  MATERIAL_UNIT_LENGTH,
  TRANSVERSE_FRAME_HALF_SIZE,
  WAVE_AXIS_HALF_LENGTH,
  WAVE_SAMPLE_COUNT,
} from "../../LightPropagationConstants.js";
import type { WaveSceneModel } from "../model/WaveSceneModel.js";
import { applyThreeCompatibilityShims } from "./threeCompat.js";
import type { WaveSceneCamera } from "./WaveSceneCamera.js";

/** Radians of orbit per pixel of drag. */
const ORBIT_SPEED = 0.005;

/** Orbit step for one arrow-key press. */
const KEYBOARD_ORBIT_STEP = (5 * Math.PI) / 180;

/** Zoom factor for one wheel notch / key press. */
const KEYBOARD_ZOOM_FACTOR = 1.1;

/** Arrows shorter than this (axis units) are hidden instead of degenerate. */
const MIN_ARROW_LENGTH = 0.05;

const LEFT_END_INDEX = 0;
const RIGHT_END_INDEX = WAVE_SAMPLE_COUNT - 1;

export type WaveDisplayNodeOptions = {
  /** Layout-pixel shift of the projection center (negative x moves the scene left of the panels). */
  viewOffset?: Vector2;
  accessibleName?: TReadOnlyProperty<string>;
  accessibleHelpText?: TReadOnlyProperty<string>;
  /** Localized warning shown when WebGL is unavailable. */
  webglWarningStringProperty: TReadOnlyProperty<string>;
};

/** Creates a line material whose color tracks a ProfileColorProperty. */
function createLinkedLineMaterial(colorProperty: ProfileColorProperty, opacity = 1): THREE.LineBasicMaterial {
  const material = new THREE.LineBasicMaterial(opacity < 1 ? { transparent: true, opacity } : undefined);
  colorProperty.link((color: Color) => {
    material.color.copy(ThreeUtils.colorToThree(color));
  });
  return material;
}

/** A polyline whose 289 vertices are refreshed each frame from a FieldSampler buffer. */
class DynamicCurve {
  public readonly line: THREE.Line;
  private readonly positions: Float32Array;
  private readonly positionAttribute: THREE.BufferAttribute;

  public constructor(colorProperty: ProfileColorProperty, xGrid: Float32Array) {
    this.positions = new Float32Array(WAVE_SAMPLE_COUNT * 3);
    // x never changes; update() rewrites only the transverse (y, z) components.
    for (let i = 0; i < WAVE_SAMPLE_COUNT; i++) {
      this.positions[3 * i] = xGrid[i] ?? 0;
    }
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.positionAttribute.setUsage(THREE.DynamicDrawUsage);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", this.positionAttribute);
    this.line = new THREE.Line(geometry, createLinkedLineMaterial(colorProperty));
    this.line.frustumCulled = false;
  }

  public update(pairs: Float32Array): void {
    for (let i = 0; i < WAVE_SAMPLE_COUNT; i++) {
      this.positions[3 * i + 1] = pairs[2 * i] ?? 0;
      this.positions[3 * i + 2] = pairs[2 * i + 1] ?? 0;
    }
    this.positionAttribute.needsUpdate = true;
  }
}

const scratchDirection = new THREE.Vector3();

/** A field-vector arrow anchored on the axis at one end of the domain. */
class EndArrow {
  public readonly arrow: THREE.ArrowHelper;
  private readonly headLength: number;
  private readonly headWidth: number;

  public constructor(x: number, colorProperty: ProfileColorProperty, headScale = 1) {
    this.headLength = 0.9 * headScale;
    this.headWidth = 0.45 * headScale;
    this.arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(x, 0, 0),
      1,
      0xffffff,
      this.headLength,
      this.headWidth,
    );
    this.arrow.line.frustumCulled = false;
    this.arrow.cone.frustumCulled = false;
    colorProperty.link((color: Color) => {
      this.arrow.setColor(ThreeUtils.colorToThree(color));
    });
  }

  public update(eY: number, eZ: number, shouldShow: boolean): void {
    const length = Math.hypot(eY, eZ);
    const visible = shouldShow && length > MIN_ARROW_LENGTH;
    this.arrow.visible = visible;
    if (visible) {
      scratchDirection.set(0, eY, eZ).normalize();
      this.arrow.setDirection(scratchDirection);
      this.arrow.setLength(length, Math.min(this.headLength, 0.6 * length), this.headWidth);
    }
  }
}

export class WaveDisplayNode extends Node {
  public readonly supportsWebGL: boolean;

  /** null when WebGL is unavailable. */
  public readonly sceneNode: ThreeIsometricNode | null = null;

  public readonly contextLostEmitter: TEmitter = new TinyEmitter();
  public readonly contextRestoredEmitter: TEmitter = new TinyEmitter();

  private readonly model: WaveSceneModel;
  private readonly camera: WaveSceneCamera;

  private wave1Curve!: DynamicCurve;
  private wave2Curve!: DynamicCurve;
  private sumCurve!: DynamicCurve;
  private wave1BCurve!: DynamicCurve;
  private wave2BCurve!: DynamicCurve;
  private sumBCurve!: DynamicCurve;

  // E-vector arrows, [leftEnd, rightEnd] per curve.
  private wave1Arrows!: EndArrow[];
  private wave2Arrows!: EndArrow[];
  private sumArrows!: EndArrow[];

  private constructionLines!: THREE.LineSegments;
  private readonly constructionPositions = new Float32Array(8 * 3);
  private constructionAttribute!: THREE.BufferAttribute;

  private materialGroup!: THREE.Group;

  public constructor(
    model: WaveSceneModel,
    camera: WaveSceneCamera,
    layoutBounds: Bounds2,
    providedOptions: WaveDisplayNodeOptions,
  ) {
    super({
      tagName: "div",
      focusable: true,
      accessibleName: providedOptions.accessibleName ?? null,
      accessibleHelpText: providedOptions.accessibleHelpText ?? null,
    });

    this.model = model;
    this.camera = camera;

    applyThreeCompatibilityShims();
    this.supportsWebGL = ThreeUtils.isWebGLEnabled();

    if (!this.supportsWebGL) {
      this.addChild(
        new Text(providedOptions.webglWarningStringProperty, {
          font: new PhetFont(16),
          fill: LightPropagationColors.textColorProperty,
          maxWidth: 0.8 * layoutBounds.width,
          center: layoutBounds.center,
        }),
      );
      return;
    }

    this.sceneNode = new ThreeIsometricNode(layoutBounds, {
      fov: CAMERA_FOV_DEGREES,
      backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
      viewOffset: providedOptions.viewOffset ?? new Vector2(0, 0),
    });
    this.addChild(this.sceneNode);

    this.sceneNode.stage.contextLostEmitter.addListener(() => this.contextLostEmitter.emit());
    this.sceneNode.stage.contextRestoredEmitter.addListener(() => this.contextRestoredEmitter.emit());

    const scene = this.sceneNode.stage.threeScene;
    this.buildStaticFurniture(scene);
    this.buildCurves(scene);
    this.buildArrowsAndConstructionLines(scene);
    this.buildMaterialBox(scene);
    this.addCameraListeners();

    // Position the camera before the first render so no frame shows the
    // default orientation.
    this.updateCamera();
  }

  // ── Scene construction ──────────────────────────────────────────────────────

  /** Axis line, transverse square frames and crosshairs at both ends. */
  private buildStaticFurniture(scene: THREE.Scene): void {
    const material = createLinkedLineMaterial(LightPropagationColors.axes3DColorProperty);
    const h = TRANSVERSE_FRAME_HALF_SIZE;
    const segments: number[] = [
      // propagation axis
      -WAVE_AXIS_HALF_LENGTH,
      0,
      0,
      WAVE_AXIS_HALF_LENGTH,
      0,
      0,
    ];
    for (const x of [-WAVE_AXIS_HALF_LENGTH, WAVE_AXIS_HALF_LENGTH]) {
      // crosshairs
      segments.push(x, -h, 0, x, h, 0);
      segments.push(x, 0, -h, x, 0, h);
      // square frame as four segments
      segments.push(x, -h, -h, x, -h, h);
      segments.push(x, -h, h, x, h, h);
      segments.push(x, h, h, x, h, -h);
      segments.push(x, h, -h, x, -h, -h);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segments), 3));
    const lines = new THREE.LineSegments(geometry, material);
    lines.frustumCulled = false;
    scene.add(lines);
  }

  private buildCurves(scene: THREE.Scene): void {
    const xGrid = this.model.sampler.xGrid;
    this.wave1Curve = new DynamicCurve(LightPropagationColors.wave1ColorProperty, xGrid);
    this.wave2Curve = new DynamicCurve(LightPropagationColors.wave2ColorProperty, xGrid);
    this.sumCurve = new DynamicCurve(LightPropagationColors.superpositionColorProperty, xGrid);
    this.wave1BCurve = new DynamicCurve(LightPropagationColors.bField1ColorProperty, xGrid);
    this.wave2BCurve = new DynamicCurve(LightPropagationColors.bField2ColorProperty, xGrid);
    this.sumBCurve = new DynamicCurve(LightPropagationColors.bFieldSumColorProperty, xGrid);
    for (const curve of [
      this.wave1Curve,
      this.wave2Curve,
      this.sumCurve,
      this.wave1BCurve,
      this.wave2BCurve,
      this.sumBCurve,
    ]) {
      scene.add(curve.line);
    }
  }

  private buildArrowsAndConstructionLines(scene: THREE.Scene): void {
    const makePair = (colorProperty: ProfileColorProperty, headScale: number): EndArrow[] => {
      const pair = [
        new EndArrow(-WAVE_AXIS_HALF_LENGTH, colorProperty, headScale),
        new EndArrow(WAVE_AXIS_HALF_LENGTH, colorProperty, headScale),
      ];
      for (const arrow of pair) {
        scene.add(arrow.arrow);
      }
      return pair;
    };
    this.wave1Arrows = makePair(LightPropagationColors.wave1ColorProperty, 1);
    this.wave2Arrows = makePair(LightPropagationColors.wave2ColorProperty, 1);
    this.sumArrows = makePair(LightPropagationColors.superpositionColorProperty, 1.5);

    this.constructionAttribute = new THREE.BufferAttribute(this.constructionPositions, 3);
    this.constructionAttribute.setUsage(THREE.DynamicDrawUsage);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", this.constructionAttribute);
    this.constructionLines = new THREE.LineSegments(
      geometry,
      createLinkedLineMaterial(LightPropagationColors.constructionLineColorProperty),
    );
    this.constructionLines.frustumCulled = false;
    scene.add(this.constructionLines);
  }

  private buildMaterialBox(scene: THREE.Scene): void {
    const unitBox = new THREE.BoxGeometry(1, MATERIAL_CROSS_SECTION, MATERIAL_CROSS_SECTION);

    const fillMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    LightPropagationColors.materialColorProperty.link((color: Color) => {
      fillMaterial.color.copy(ThreeUtils.colorToThree(color));
    });
    const fill = new THREE.Mesh(unitBox, fillMaterial);
    fill.frustumCulled = false;

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(unitBox),
      createLinkedLineMaterial(LightPropagationColors.materialColorProperty),
    );
    edges.frustumCulled = false;

    this.materialGroup = new THREE.Group();
    this.materialGroup.add(fill);
    this.materialGroup.add(edges);
    scene.add(this.materialGroup);

    this.model.material.lengthNumberProperty.link((m: number) => {
      this.materialGroup.scale.x = m * MATERIAL_UNIT_LENGTH;
      this.materialGroup.updateMatrixWorld();
    });
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  private addCameraListeners(): void {
    const sceneNode = this.sceneNode;
    if (!sceneNode) {
      return;
    }
    const target = sceneNode.backgroundEventTarget;
    target.cursor = "pointer";

    let lastPoint: Vector2 | null = null;
    target.addInputListener(
      new DragListener({
        press: (_event, listener) => {
          lastPoint = listener.pointer.point.copy();
        },
        drag: (_event, listener) => {
          const point = listener.pointer.point;
          if (lastPoint) {
            this.camera.orbit(-(point.x - lastPoint.x) * ORBIT_SPEED, (point.y - lastPoint.y) * ORBIT_SPEED);
          }
          lastPoint = point.copy();
        },
        release: () => {
          lastPoint = null;
        },
      }),
    );

    target.addInputListener({
      wheel: (event) => {
        const domEvent = event.domEvent as WheelEvent | null;
        if (domEvent) {
          this.camera.zoomBy(Math.exp(domEvent.deltaY * 0.001));
        }
      },
    });

    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown", "plus", "equals", "minus"],
        fireOnHold: true,
        fire: (_event, keysPressed) => {
          if (keysPressed === "arrowLeft") {
            this.camera.orbit(KEYBOARD_ORBIT_STEP, 0);
          } else if (keysPressed === "arrowRight") {
            this.camera.orbit(-KEYBOARD_ORBIT_STEP, 0);
          } else if (keysPressed === "arrowUp") {
            this.camera.orbit(0, KEYBOARD_ORBIT_STEP);
          } else if (keysPressed === "arrowDown") {
            this.camera.orbit(0, -KEYBOARD_ORBIT_STEP);
          } else if (keysPressed === "minus") {
            this.camera.zoomBy(KEYBOARD_ZOOM_FACTOR);
          } else {
            this.camera.zoomBy(1 / KEYBOARD_ZOOM_FACTOR);
          }
        },
      }),
    );
  }

  // ── Per-frame updates ───────────────────────────────────────────────────────

  private updateCamera(): void {
    const sceneNode = this.sceneNode;
    if (!sceneNode) {
      return;
    }
    const threeCamera = sceneNode.stage.threeCamera;
    const position = scratchDirection; // reused as a scratch position
    this.camera.getPosition(position);
    threeCamera.position.set(position.x, position.y, position.z);
    threeCamera.up.set(0, 1, 0);
    threeCamera.lookAt(0, 0, 0);

    const fov = this.camera.fovDegrees;
    const distance = this.camera.distance;
    const near = Math.max(1, distance - 50);
    const far = distance + 50;
    if (threeCamera.fov !== fov || threeCamera.near !== near || threeCamera.far !== far) {
      threeCamera.fov = fov;
      threeCamera.near = near;
      threeCamera.far = far;
      threeCamera.updateProjectionMatrix();
    }
  }

  private updateSceneGraph(): void {
    const model = this.model;
    const sampler = model.sampler;
    const wave1On = model.wave1.enabledProperty.value;
    const wave2On = model.wave2.enabledProperty.value;
    const sumOn = model.sumEnabledProperty.value;
    const curvesOn = model.componentCurvesVisibleProperty.value;
    const sumCurveOn = model.sumCurveVisibleProperty.value;
    const arrowsOn = model.eVectorsVisibleProperty.value;
    const bOn = model.bFieldVisibleProperty.value;

    this.wave1Curve.line.visible = wave1On && curvesOn;
    this.wave2Curve.line.visible = wave2On && curvesOn;
    this.sumCurve.line.visible = sumOn && sumCurveOn;
    this.wave1BCurve.line.visible = bOn && wave1On && curvesOn;
    this.wave2BCurve.line.visible = bOn && wave2On && curvesOn;
    this.sumBCurve.line.visible = bOn && sumOn && sumCurveOn;

    if (this.wave1Curve.line.visible) {
      this.wave1Curve.update(sampler.wave1Electric);
    }
    if (this.wave2Curve.line.visible) {
      this.wave2Curve.update(sampler.wave2Electric);
    }
    if (this.sumCurve.line.visible) {
      this.sumCurve.update(sampler.sumElectric);
    }
    if (this.wave1BCurve.line.visible) {
      this.wave1BCurve.update(sampler.wave1Magnetic);
    }
    if (this.wave2BCurve.line.visible) {
      this.wave2BCurve.update(sampler.wave2Magnetic);
    }
    if (this.sumBCurve.line.visible) {
      this.sumBCurve.update(sampler.sumMagnetic);
    }

    for (const [endIndex, sampleIndex] of [LEFT_END_INDEX, RIGHT_END_INDEX].entries()) {
      const e1y = sampler.wave1Electric[2 * sampleIndex] ?? 0;
      const e1z = sampler.wave1Electric[2 * sampleIndex + 1] ?? 0;
      const e2y = sampler.wave2Electric[2 * sampleIndex] ?? 0;
      const e2z = sampler.wave2Electric[2 * sampleIndex + 1] ?? 0;
      const sy = sampler.sumElectric[2 * sampleIndex] ?? 0;
      const sz = sampler.sumElectric[2 * sampleIndex + 1] ?? 0;

      this.wave1Arrows[endIndex]?.update(e1y, e1z, arrowsOn && wave1On);
      this.wave2Arrows[endIndex]?.update(e2y, e2z, arrowsOn && wave2On);
      this.sumArrows[endIndex]?.update(sy, sz, arrowsOn && sumOn);

      // Construction lines: component arrow tips → sum arrow tip at this end.
      const x = endIndex === 0 ? -WAVE_AXIS_HALF_LENGTH : WAVE_AXIS_HALF_LENGTH;
      const base = endIndex * 12;
      this.constructionPositions[base] = x;
      this.constructionPositions[base + 1] = e1y;
      this.constructionPositions[base + 2] = e1z;
      this.constructionPositions[base + 3] = x;
      this.constructionPositions[base + 4] = sy;
      this.constructionPositions[base + 5] = sz;
      this.constructionPositions[base + 6] = x;
      this.constructionPositions[base + 7] = e2y;
      this.constructionPositions[base + 8] = e2z;
      this.constructionPositions[base + 9] = x;
      this.constructionPositions[base + 10] = sy;
      this.constructionPositions[base + 11] = sz;
    }
    this.constructionAttribute.needsUpdate = true;
    this.constructionLines.visible = arrowsOn && sumOn;

    this.materialGroup.visible = this.model.material.enabledProperty.value;
  }

  // ── ScreenView hooks ────────────────────────────────────────────────────────

  /** Sizes the three.js stage; call from ScreenView.layout with the window dimensions. */
  public layoutStage(width: number, height: number): void {
    this.sceneNode?.layout(width, height);
  }

  /** Refreshes camera + scene from the model and renders one frame. */
  public render(): void {
    if (!this.sceneNode) {
      return;
    }
    this.updateCamera();
    this.updateSceneGraph();
    this.sceneNode.render(undefined);
  }
}
