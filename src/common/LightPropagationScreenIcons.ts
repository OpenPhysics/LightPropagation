/**
 * LightPropagationScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for the four Light Propagation
 * screens. Drawn on the standard PhET 548 × 373 canvas using LightPropagationColors.
 *
 *   Intro        — a single electric-field sine wave along the propagation axis.
 *   Polarization — two orthogonal field components (red + green).
 *   Wave Plates  — wave entering an orange material slab.
 *   Lab          — two component waves plus cyan superposition.
 */
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import LightPropagationColors from "../LightPropagationColors.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: LightPropagationColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: LightPropagationColors.backgroundColorProperty,
  });
}

function sineWave(
  x0: number,
  x1: number,
  y0: number,
  amp: number,
  cycles: number,
  phase: number,
  stroke: unknown,
  lineWidth = 5,
): Path {
  const samples = 64;
  const shape = new Shape();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = x0 + t * (x1 - x0);
    const y = y0 + amp * Math.sin(phase + t * cycles * Math.PI * 2);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  return new Path(shape, {
    stroke: stroke as never,
    lineWidth,
    lineCap: "round",
    lineJoin: "round",
  });
}

function axis(y: number): Line {
  return new Line(40, y, W - 40, y, {
    stroke: LightPropagationColors.axes3DColorProperty,
    lineWidth: 3,
  });
}

export function createIntroIcon(): ScreenIcon {
  const y = H / 2;
  return iconFrom(
    new Node({
      children: [
        background(),
        axis(y),
        sineWave(50, W - 50, y, 70, 2.2, 0, LightPropagationColors.wave1ColorProperty, 6),
      ],
    }),
  );
}

export function createPolarizationIcon(): ScreenIcon {
  const y = H / 2;
  // Orthogonal look: horizontal propagation with vertical E (red) and a
  // second wave drawn with a phase offset to suggest the perpendicular B/E pair.
  return iconFrom(
    new Node({
      children: [
        background(),
        axis(y),
        sineWave(50, W - 50, y, 78, 2, 0, LightPropagationColors.wave1ColorProperty, 6),
        sineWave(50, W - 50, y, 48, 2, Math.PI / 2, LightPropagationColors.wave2ColorProperty, 5),
      ],
    }),
  );
}

export function createWavePlatesIcon(): ScreenIcon {
  const y = H / 2;
  const slab = new Rectangle(W / 2 - 55, 70, 110, H - 140, 8, 8, {
    fill: LightPropagationColors.materialColorProperty,
    opacity: 0.45,
    stroke: LightPropagationColors.materialColorProperty,
    lineWidth: 3,
  });
  return iconFrom(
    new Node({
      children: [
        background(),
        axis(y),
        sineWave(40, W / 2 - 55, y, 60, 1.2, 0, LightPropagationColors.wave1ColorProperty, 6),
        slab,
        sineWave(W / 2 + 55, W - 40, y, 60, 1.2, 0.8, LightPropagationColors.superpositionColorProperty, 6),
      ],
    }),
  );
}

export function createLabIcon(): ScreenIcon {
  const y = H / 2;
  return iconFrom(
    new Node({
      children: [
        background(),
        axis(y),
        sineWave(50, W - 50, y, 55, 2, 0, LightPropagationColors.wave1ColorProperty, 4),
        sineWave(50, W - 50, y, 55, 2, 1.1, LightPropagationColors.wave2ColorProperty, 4),
        sineWave(50, W - 50, y, 85, 2, 0.55, LightPropagationColors.superpositionColorProperty, 6),
      ],
    }),
  );
}
