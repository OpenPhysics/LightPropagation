# Light Propagation

An interactive simulation of how light propagates through polarizers and wave plates, built with
[SceneryStack](https://scenerystack.org/), Vite 8, TypeScript 7, and Biome 2.

## Features

### Screens

- **Intro** (`src/intro/`) — single vertical wave; introduces polarization, amplitude, wavelength, and the 3D view
- **Polarization** (`src/polarization/`) — two waves through an optional dichroic polarizing filter
- **Wave Plates** (`src/wave-plates/`) — birefringent slab with retardation readout (quarter- and half-wave presets)
- **Lab** (`src/lab/`) — full control surface with 20 presets and custom exploration

Each screen composes the shared `WaveSceneModel` (`src/common/model/`) — electromagnetic wave propagation, optical materials, and field sampling — with screen-specific initial state and controls.

### Capabilities

- Four-screen SceneryStack simulation with model/view separation per screen
- English, French, and Spanish localization via `StringManager`
- Default and projector color profiles
- Progressive Web App (installable, offline-capable)
- Git hooks for Biome pre-commit checks
- Shared GitHub Actions CI via `OpenPhysics/Baton`

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from public/icons/icon.svg
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run build:single` | Type-check + single-screen production build |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript type check (app + scripts) |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run release` | Check, lint, build, bump patch version, push + tags |
| `npm run watch` | TypeScript watch mode |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run rename` | Rename sim identifiers via `scripts/rename-sim.ts` |
| `npm run clean` | Remove `dist/` |
| `npm run prepare` | Install git hooks (`.githooks`) when in a git repo |

New sims start at `version: "0.0.0"` in `package.json`. Bump only when cutting a release (for example `npm version patch` and a matching git tag). Keep `name` in kebab-case; it is separate from the SceneryStack sim identifier in `src/init.ts`.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^1 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenPhysics org license](https://github.com/OpenPhysics/.github/blob/main/LICENSE).

## Contributing

See [OpenPhysics contributing guidelines](https://github.com/OpenPhysics/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
