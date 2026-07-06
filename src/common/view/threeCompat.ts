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
 *   - `ThreeUtils.isWebGLEnabled()` delegates to `Utils.checkWebGLSupport()`
 *     which passes `{ failIfMajorPerformanceCaveat: true }` to getContext().
 *     That rejects software-rendered WebGL (remote desktop, VMs, some Linux
 *     drivers), even though three.js itself never sets the flag and runs fine
 *     in those environments. The override below replaces the check with a
 *     plain context probe that accepts any working WebGL implementation.
 *
 * Call {@link applyThreeCompatibilityShims} before constructing any mobius
 * stage. All shims are no-ops if a future scenerystack stops needing them
 * (or if three is downgraded to a version that still has the members).
 */

import { THREE, ThreeUtils } from "scenerystack/mobius";
import { getGlobal } from "scenerystack/phet-core";

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

  ThreeUtils.isWebGLEnabled = (): boolean => {
    // Respect the ?webgl=false query parameter.
    if (getGlobal("phet.chipper.queryParameters.webgl") === false) {
      return false;
    }
    // Plain context probe without failIfMajorPerformanceCaveat — matches
    // how three.js itself creates renderers.
    const canvas = document.createElement("canvas");
    try {
      return !!(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  };
}
