/**
 * OpticalMaterial.ts
 *
 * Reactive model of the material slab: on/off, length, and the refractive
 * index n and extinction coefficient κ that each wave sees. One abstraction
 * covers absorbers, refractive media, polarizers (κ₁ ≠ κ₂), wave plates
 * (n₁ ≠ n₂) and optically active media (circular basis + n₁ ≠ n₂).
 *
 * The "same as wave 1" coupling replicates EMANIM:
 *   - checking it copies wave 1's n/κ onto wave 2 and keeps them tracking;
 *   - manually editing wave 2's n/κ automatically unchecks it.
 * A reentrancy guard stops the copy itself from unchecking the box.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import {
  EXTINCTION_RANGE,
  MATERIAL_LENGTH_RANGE,
  MATERIAL_UNIT_LENGTH,
  REFRACTIVE_INDEX_RANGE,
} from "../../LightPropagationConstants.js";
import type { MaterialState } from "./WaveSceneState.js";

export class OpticalMaterial {
  /** Whether the slab is present in the scene. */
  public readonly enabledProperty: BooleanProperty;

  /** Integer material length number m, 1–32; slab length L = m·π/2. */
  public readonly lengthNumberProperty: NumberProperty;

  /** Refractive index seen by wave 1. */
  public readonly n1Property: NumberProperty;

  /** Extinction coefficient seen by wave 1. */
  public readonly kappa1Property: NumberProperty;

  /** Refractive index seen by wave 2. */
  public readonly n2Property: NumberProperty;

  /** Extinction coefficient seen by wave 2. */
  public readonly kappa2Property: NumberProperty;

  /** When true, wave 2's n/κ are locked to wave 1's. */
  public readonly sameAsWave1Property: BooleanProperty;

  // True while this class itself writes n2/kappa2, so those writes don't
  // count as "manual edits" that uncheck sameAsWave1.
  private isCoupling = false;

  public constructor(initialState: MaterialState) {
    this.enabledProperty = new BooleanProperty(initialState.enabled);
    this.lengthNumberProperty = new NumberProperty(initialState.lengthNumber, {
      range: MATERIAL_LENGTH_RANGE,
      numberType: "Integer",
    });
    this.n1Property = new NumberProperty(initialState.n1, { range: REFRACTIVE_INDEX_RANGE });
    this.kappa1Property = new NumberProperty(initialState.kappa1, { range: EXTINCTION_RANGE });
    this.n2Property = new NumberProperty(initialState.n2, { range: REFRACTIVE_INDEX_RANGE });
    this.kappa2Property = new NumberProperty(initialState.kappa2, { range: EXTINCTION_RANGE });
    this.sameAsWave1Property = new BooleanProperty(initialState.sameAsWave1);

    // Checking the box snaps wave 2's values to wave 1's.
    this.sameAsWave1Property.link((same) => {
      if (same) {
        this.copyWave1ToWave2();
      }
    });

    // While checked, wave 1 edits propagate to wave 2.
    const track = (): void => {
      if (this.sameAsWave1Property.value) {
        this.copyWave1ToWave2();
      }
    };
    this.n1Property.lazyLink(track);
    this.kappa1Property.lazyLink(track);

    // A manual wave 2 edit (any write not performed by the coupling) unchecks the box.
    const uncoupleOnManualEdit = (): void => {
      if (!this.isCoupling) {
        this.sameAsWave1Property.value = false;
      }
    };
    this.n2Property.lazyLink(uncoupleOnManualEdit);
    this.kappa2Property.lazyLink(uncoupleOnManualEdit);
  }

  private copyWave1ToWave2(): void {
    this.isCoupling = true;
    this.n2Property.value = this.n1Property.value;
    this.kappa2Property.value = this.kappa1Property.value;
    this.isCoupling = false;
  }

  /** Slab length L = m·π/2, in axis units. */
  public get length(): number {
    return this.lengthNumberProperty.value * MATERIAL_UNIT_LENGTH;
  }

  public applyState(state: MaterialState): void {
    this.enabledProperty.value = state.enabled;
    this.lengthNumberProperty.value = state.lengthNumber;
    // Order matters: setting n2/kappa2 while sameAsWave1 is checked would
    // uncheck it, so uncheck first, set values, then apply the stored flag
    // (which re-copies wave 1's values if checked — consistent by definition).
    this.sameAsWave1Property.value = false;
    this.n1Property.value = state.n1;
    this.kappa1Property.value = state.kappa1;
    this.isCoupling = true;
    this.n2Property.value = state.n2;
    this.kappa2Property.value = state.kappa2;
    this.isCoupling = false;
    this.sameAsWave1Property.value = state.sameAsWave1;
  }

  public getState(): MaterialState {
    return {
      enabled: this.enabledProperty.value,
      lengthNumber: this.lengthNumberProperty.value,
      n1: this.n1Property.value,
      kappa1: this.kappa1Property.value,
      n2: this.n2Property.value,
      kappa2: this.kappa2Property.value,
      sameAsWave1: this.sameAsWave1Property.value,
    };
  }

  public reset(): void {
    this.enabledProperty.reset();
    this.lengthNumberProperty.reset();
    this.sameAsWave1Property.reset();
    this.n1Property.reset();
    this.kappa1Property.reset();
    this.isCoupling = true;
    this.n2Property.reset();
    this.kappa2Property.reset();
    this.isCoupling = false;
    // Re-run the coupling in case the initial state had sameAsWave1 checked.
    if (this.sameAsWave1Property.value) {
      this.copyWave1ToWave2();
    }
  }
}
