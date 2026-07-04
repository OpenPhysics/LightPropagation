/**
 * WaveSceneCamera.ts
 *
 * Orbit-camera state for the 3D wave view: yaw/pitch around the origin, a
 * zoom "range", and a parallel-projection flag. Pure axon/dot — the
 * WaveDisplayNode reads these each frame and positions the three.js camera.
 *
 * EMANIM geometry: the camera looks at the origin from
 *   distance = range / tan(fov/2)
 * with fov = 15°. Parallel projection is emulated by narrowing the fov to
 * 0.5° and dollying out (mobius's camera is hard-typed as perspective);
 * EMANIM plays the same trick.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Vector3 } from "scenerystack/dot";
import {
  CAMERA_FOV_DEGREES,
  CAMERA_PARALLEL_FOV_DEGREES,
  CAMERA_RANGE,
  CAMERA_RANGE_DEFAULT,
  NICE_VIEW_FORWARD,
} from "../../LightPropagationConstants.js";

export const CameraPresetValues = ["nice", "side", "front", "back"] as const;
export type CameraPreset = (typeof CameraPresetValues)[number];

/** Forward (look) directions of the camera presets, unit vectors. */
const PRESET_FORWARDS: Record<CameraPreset, Vector3> = {
  nice: NICE_VIEW_FORWARD,
  side: new Vector3(0, 0, -1),
  front: new Vector3(-1, 0, 0),
  back: new Vector3(1, 0, 0),
};

const MAX_PITCH = (89 * Math.PI) / 180;

function presetYaw(preset: CameraPreset): number {
  const u = PRESET_FORWARDS[preset].negated();
  return Math.atan2(u.z, u.x);
}

function presetPitch(preset: CameraPreset): number {
  const u = PRESET_FORWARDS[preset].negated();
  return Math.asin(Math.max(-1, Math.min(1, u.y)));
}

export class WaveSceneCamera {
  /** Azimuth of the camera around the vertical (y) axis, radians. */
  public readonly yawProperty: NumberProperty;

  /** Elevation of the camera above the x-z plane, radians, clamped to ±89°. */
  public readonly pitchProperty: NumberProperty;

  /** Zoom: half the visible vertical extent at the origin, in axis units. */
  public readonly rangeProperty: NumberProperty;

  /** Emulates a parallel projection (fov 15° → 0.5° with a compensating dolly). */
  public readonly parallelProjectionProperty = new BooleanProperty(false);

  public constructor(initialPreset: CameraPreset = "nice") {
    this.yawProperty = new NumberProperty(presetYaw(initialPreset));
    this.pitchProperty = new NumberProperty(presetPitch(initialPreset));
    this.rangeProperty = new NumberProperty(CAMERA_RANGE_DEFAULT, { range: CAMERA_RANGE });
  }

  public get fovDegrees(): number {
    return this.parallelProjectionProperty.value ? CAMERA_PARALLEL_FOV_DEGREES : CAMERA_FOV_DEGREES;
  }

  /** Camera distance from the origin: range / tan(fov/2). */
  public get distance(): number {
    return this.rangeProperty.value / Math.tan((this.fovDegrees * Math.PI) / 360);
  }

  /** Writes the camera's world position into `out` (allocation-free). */
  public getPosition(out: { x: number; y: number; z: number }): void {
    const yaw = this.yawProperty.value;
    const pitch = this.pitchProperty.value;
    const d = this.distance;
    out.x = d * Math.cos(pitch) * Math.cos(yaw);
    out.y = d * Math.sin(pitch);
    out.z = d * Math.cos(pitch) * Math.sin(yaw);
  }

  /** Orbits by the given angular deltas (radians), clamping pitch to ±89°. */
  public orbit(deltaYaw: number, deltaPitch: number): void {
    this.yawProperty.value += deltaYaw;
    this.pitchProperty.value = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitchProperty.value + deltaPitch));
  }

  /** Multiplies the range by `factor` (> 1 zooms out), clamped to 6–60. */
  public zoomBy(factor: number): void {
    this.rangeProperty.value = CAMERA_RANGE.constrainValue(this.rangeProperty.value * factor);
  }

  public setPreset(preset: CameraPreset): void {
    this.yawProperty.value = presetYaw(preset);
    this.pitchProperty.value = presetPitch(preset);
  }

  public reset(): void {
    this.yawProperty.reset();
    this.pitchProperty.reset();
    this.rangeProperty.reset();
    this.parallelProjectionProperty.reset();
  }
}
