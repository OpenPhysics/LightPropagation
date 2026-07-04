/**
 * LightPropagationColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import LightPropagationColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import LightPropagationColors from "../../LightPropagationColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: LightPropagationColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the LightPropagationColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import LightPropagationNamespace from "./LightPropagationNamespace.js";

const LightPropagationColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(LightPropagationNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(LightPropagationNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(LightPropagationNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(LightPropagationNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(LightPropagationNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(LightPropagationNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(LightPropagationNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(LightPropagationNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── 3D wave scene ────────────────────────────────────────────────────────────
  // Colors for the electric-field curves, magnetic-field curves, material slab
  // and scene furniture in the three.js viewport. Each is linked into a three.js
  // material, so default/projector switching restyles the 3D scene too.

  /** Electric field of wave 1 (curve + end arrows). */
  wave1ColorProperty: new ProfileColorProperty(LightPropagationNamespace, "wave1", {
    default: "#ff4444",
    projector: "#cc0000",
  }),

  /** Electric field of wave 2 (curve + end arrows). */
  wave2ColorProperty: new ProfileColorProperty(LightPropagationNamespace, "wave2", {
    default: "#44dd44",
    projector: "#008800",
  }),

  /** Electric field of the superposition (sum) of both waves. */
  superpositionColorProperty: new ProfileColorProperty(LightPropagationNamespace, "superposition", {
    default: "#00ffff",
    projector: "#008080",
  }),

  /** Magnetic field of wave 1 (violet family, dimmer than the E-field colors). */
  bField1ColorProperty: new ProfileColorProperty(LightPropagationNamespace, "bField1", {
    default: "#8855dd",
    projector: "#6633aa",
  }),

  /** Magnetic field of wave 2. */
  bField2ColorProperty: new ProfileColorProperty(LightPropagationNamespace, "bField2", {
    default: "#bb66dd",
    projector: "#993399",
  }),

  /** Magnetic field of the superposition. */
  bFieldSumColorProperty: new ProfileColorProperty(LightPropagationNamespace, "bFieldSum", {
    default: "#dd99ff",
    projector: "#aa55cc",
  }),

  /** Material slab wirebox and translucent fill. */
  materialColorProperty: new ProfileColorProperty(LightPropagationNamespace, "material", {
    default: "#ff8000",
    projector: "#b35900",
  }),

  /** Propagation axis, transverse frames, and crosshairs in the 3D scene. */
  axes3DColorProperty: new ProfileColorProperty(LightPropagationNamespace, "axes3D", {
    default: "#4c4c4c",
    projector: "#aaaaaa",
  }),

  /** Construction lines connecting component E-vector tips to the sum vector tip. */
  constructionLineColorProperty: new ProfileColorProperty(LightPropagationNamespace, "constructionLine", {
    default: "#ffff00",
    projector: "#999900",
  }),
};

export default LightPropagationColors;
