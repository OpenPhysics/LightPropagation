/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screen, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. It triggers the full bootstrap chain:
 *
 *   brand.ts → splash.ts → assert.ts → init.ts
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first — triggers: init.ts → assert.ts → splash.ts → brand.ts
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import { IntroScreen } from "./intro/IntroScreen.js";
import LightPropagationColors from "./LightPropagationColors.js";
import { LabScreen } from "./lab/LabScreen.js";
import { PolarizationScreen } from "./polarization/PolarizationScreen.js";
// Declares the permalink query parameters (and logs them) at startup.
import "./preferences/lightPropagationQueryParameters.js";
import { WavePlatesScreen } from "./wave-plates/WavePlatesScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const screenNames = stringManager.getScreenNames();

  // Screen name Properties update automatically when the locale changes.
  const screens = [
    new IntroScreen({
      name: screenNames.introStringProperty,
      tandem: Tandem.ROOT.createTandem("introScreen"),
      backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
    }),
    new PolarizationScreen({
      name: screenNames.polarizationStringProperty,
      tandem: Tandem.ROOT.createTandem("polarizationScreen"),
      backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
    }),
    new WavePlatesScreen({
      name: screenNames.wavePlatesStringProperty,
      tandem: Tandem.ROOT.createTandem("wavePlatesScreen"),
      backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
    }),
    new LabScreen({
      name: screenNames.labStringProperty,
      tandem: Tandem.ROOT.createTandem("labScreen"),
      backgroundColorProperty: LightPropagationColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
