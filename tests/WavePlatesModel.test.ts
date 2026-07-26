/**
 * WavePlatesModel.test.ts
 *
 * The Wave Plates screen model: the live retardation Δφ = (n₁ − n₂)·L/ƛ, the
 * magnitude the readouts display, and the exact quarter-/half-wave presets.
 */

import { describe, expect, it } from "vitest";
import { HALF_WAVE_PLATE, QUARTER_WAVE_PLATE, WavePlatesModel } from "../src/wave-plates/model/WavePlatesModel.js";

describe("WavePlatesModel", () => {
  it("starts as an exact quarter-wave plate", () => {
    const model = new WavePlatesModel();
    expect(model.scene.material.enabledProperty.value).toBe(true);
    expect(model.retardationRadiansProperty.value).toBeCloseTo(Math.PI / 2, 12);
    expect(model.retardationDegreesProperty.value).toBe(90);
  });

  it("the plate buttons configure exact quarter- and half-wave retardation", () => {
    const model = new WavePlatesModel();

    model.applyHalfWavePlate();
    expect(model.scene.material.lengthNumberProperty.value).toBe(HALF_WAVE_PLATE.lengthNumber);
    expect(model.retardationRadiansProperty.value).toBeCloseTo(Math.PI, 12);
    expect(model.retardationDegreesProperty.value).toBe(180);

    model.applyQuarterWavePlate();
    expect(model.scene.material.lengthNumberProperty.value).toBe(QUARTER_WAVE_PLATE.lengthNumber);
    expect(model.retardationDegreesProperty.value).toBe(90);
  });

  it("a plate button re-inserts the plate if it was removed", () => {
    const model = new WavePlatesModel();
    model.scene.material.enabledProperty.value = false;
    expect(model.retardationRadiansProperty.value).toBe(0);

    model.applyHalfWavePlate();
    expect(model.scene.material.enabledProperty.value).toBe(true);
    expect(model.retardationDegreesProperty.value).toBe(180);
  });

  it("retardation is zero while the plate is out, whatever the indices say", () => {
    const model = new WavePlatesModel();
    model.scene.material.enabledProperty.value = false;
    model.scene.material.n1Property.value = 1.5;
    expect(model.retardationRadiansProperty.value).toBe(0);
    expect(model.retardationDegreesProperty.value).toBe(0);
  });

  it("Δφ keeps its sign but the displayed degrees are a magnitude", () => {
    // Horizontal (wave 2) as the slow component makes Δφ = (n₁ − n₂)·L/ƛ negative.
    const model = new WavePlatesModel();
    model.scene.material.n1Property.value = 1.0;
    model.scene.material.n2Property.value = 1.05;

    expect(model.retardationRadiansProperty.value).toBeCloseTo(-Math.PI / 2, 12);
    // The readouts quote "90°", not "−90°" — the Fast axis readout carries the
    // sign in words, and a plate is specified by how much it retards.
    expect(model.retardationDegreesProperty.value).toBe(90);
  });

  it("retardation tracks the length control", () => {
    const model = new WavePlatesModel();
    const atTwenty = model.retardationRadiansProperty.value;
    model.scene.material.lengthNumberProperty.value = 10;
    expect(model.retardationRadiansProperty.value).toBeCloseTo(atTwenty / 2, 12);
  });
});
