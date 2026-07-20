/**
 * StringManager.ts
 *
 * Centralizes all localized string access for the simulation.
 *
 * Strings are loaded from JSON files per locale and wrapped in reactive
 * Property objects by SceneryStack. When the user switches language in the
 * Preferences dialog, all StringProperties update automatically.
 *
 * ── How to add a locale ───────────────────────────────────────────────────────
 * 1. Create src/i18n/strings_XX.json with the same keys as strings_en.json
 * 2. Import it below and add `XX: stringsXX` to the locale map
 * 3. Add "XX" to `availableLocales` in src/init.ts
 *
 * ── How to add a string ───────────────────────────────────────────────────────
 * 1. Add the key + English value to strings_en.json
 * 2. Add the same key + translated value to ALL other locale files
 *    (TypeScript will show an error here if any locale is missing a key)
 * 3. Expose the new StringProperty via a new getter method below
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import { LocalizedString } from "scenerystack/chipper";
import stringsEn from "./strings_en.json";
import stringsEs from "./strings_es.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
// TypeScript errors here if any locale file is missing a key from English.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);

// ── Build the reactive string property tree ───────────────────────────────────
const stringProperties = LocalizedString.getNestedStringProperties({
  en: stringsEn,
  fr: stringsFr,
  es: stringsEs,
});

/**
 * StringManager is a singleton that provides typed access to all localized
 * strings. Use `StringManager.getInstance()` everywhere — never construct it
 * directly.
 */
export class StringManager {
  private static instance: StringManager | null = null;

  private constructor() {
    // Private — obtain via getInstance()
  }

  public static getInstance(): StringManager {
    if (StringManager.instance === null) {
      StringManager.instance = new StringManager();
    }
    return StringManager.instance;
  }

  /**
   * The simulation title shown in the navigation bar and browser tab.
   * Updates automatically when the locale changes.
   */
  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return stringProperties.titleStringProperty;
  }

  /**
   * Screen name StringProperties used when constructing Screen instances.
   * Each property updates automatically when the locale changes.
   */
  public getScreenNames(): {
    readonly introStringProperty: ReadOnlyProperty<string>;
    readonly polarizationStringProperty: ReadOnlyProperty<string>;
    readonly wavePlatesStringProperty: ReadOnlyProperty<string>;
    readonly labStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      introStringProperty: stringProperties.screens.introStringProperty,
      polarizationStringProperty: stringProperties.screens.polarizationStringProperty,
      wavePlatesStringProperty: stringProperties.screens.wavePlatesStringProperty,
      labStringProperty: stringProperties.screens.labStringProperty,
    };
  }

  /** Simulation-specific preferences strings (Preferences → Simulation). */
  public getPreferences(): {
    readonly titleStringProperty: ReadOnlyProperty<string>;
    readonly wavelengthDependentAbsorptionStringProperty: ReadOnlyProperty<string>;
    readonly wavelengthDependentAbsorptionDescriptionStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      titleStringProperty: stringProperties.preferences.titleStringProperty,
      wavelengthDependentAbsorptionStringProperty:
        stringProperties.preferences.wavelengthDependentAbsorptionStringProperty,
      wavelengthDependentAbsorptionDescriptionStringProperty:
        stringProperties.preferences.wavelengthDependentAbsorptionDescriptionStringProperty,
    };
  }

  /**
   * Shared control-panel labels (waves, polarization, material, display,
   * camera views) used by every screen.
   */
  public getControlsStrings() {
    return stringProperties.controls;
  }

  /** Preset-menu strings: title, "Custom", category names and the 20 preset labels. */
  public getPresetsStrings() {
    return stringProperties.presets;
  }

  /** Wave Plates screen extras: QWP/HWP buttons, retardation readout, axis labels. */
  public getWavePlatesControlsStrings() {
    return stringProperties.wavePlatesControls;
  }

  /** Strings for the custom "Rotate 3D View" keyboard-help section. */
  public getKeyboardHelpStrings() {
    return stringProperties.keyboardHelp;
  }

  /**
   * Accessibility (Interactive Description) StringProperties, one method per
   * screen. Each returns a reactive `a11y` subtree used by the parallel DOM:
   *   - `screenSummary.*` — play-area / control-area overview and an interaction
   *     hint, read by the screen's `*ScreenSummaryContent`.
   *   - `currentDetails` — a paragraph describing the screen's current state.
   *     In a real sim, derive a live version from model Properties (see
   *     LunarLander's ScreenSummaryContent for the canonical pattern).
   *
   * Add `accessibleName` / `accessibleHelpText` strings for individual controls
   * to the same per-screen group, then read them through this nested tree.
   */
  /** Screen-independent a11y strings: camera-preset names, polarization phrases, motion states. */
  public getCommonA11yStrings() {
    return stringProperties.a11y.common;
  }

  public getIntroA11yStrings() {
    return stringProperties.a11y.intro;
  }

  public getPolarizationA11yStrings() {
    return stringProperties.a11y.polarization;
  }

  public getWavePlatesA11yStrings() {
    return stringProperties.a11y.wavePlates;
  }

  public getLabA11yStrings() {
    return stringProperties.a11y.lab;
  }
}
