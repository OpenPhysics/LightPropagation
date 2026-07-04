/**
 * threeCompat.ts
 *
 * Compatibility shims that let scenerystack's mobius layer (written against
 * three ~0.104–0.125) run on the modern three pinned in package.json
 * overrides (0.185):
 *
 *   - `WebGLRenderer.context` was removed from three; mobius's ThreeStage
 *     still reads `renderer.context.canvas` in its constructor to register
 *     webglcontextlost/restored listeners. A prototype getter delegating to
 *     `getContext()` restores it.
 *   - `Scene.dispose()` was removed; ThreeStage.dispose() still calls it.
 *
 * Call {@link applyThreeCompatibilityShims} before constructing any mobius
 * stage. Both shims are no-ops if a future scenerystack stops needing them
 * (or if three is downgraded to a version that still has the members).
 */

import { THREE } from "scenerystack/mobius";

type RendererWithContext = {
  context?: WebGL2RenderingContext;
  getContext(): WebGL2RenderingContext;
};

let applied = false;

export function applyThreeCompatibilityShims(): void {
  if (applied) {
    return;
  }
  applied = true;

  const rendererPrototype = THREE.WebGLRenderer.prototype as unknown as RendererWithContext;
  if (!("context" in rendererPrototype)) {
    Object.defineProperty(THREE.WebGLRenderer.prototype, "context", {
      get(this: RendererWithContext): WebGL2RenderingContext {
        return this.getContext();
      },
      configurable: true,
    });
  }

  const scenePrototype = THREE.Scene.prototype as unknown as { dispose?: () => void };
  if (typeof scenePrototype.dispose !== "function") {
    scenePrototype.dispose = (): void => {
      // Scene.dispose() no longer exists in three; nothing to release here.
    };
  }
}
