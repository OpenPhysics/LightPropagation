# Model - Light Propagation

This document describes the model (the underlying physics, math, and behavior) for the simulation, in
terms appropriate for an educator. It is the companion to
[implementation-notes.md](./implementation-notes.md), which targets developers.

## Overview

The simulation animates one or two plane electromagnetic waves traveling along a horizontal axis,
optionally passing through a slab of material centered on that axis. Each wave sees its own
refractive index *n* and extinction coefficient *κ* inside the slab, and that single abstraction
produces every phenomenon the sim teaches: absorption (κ > 0), refraction (n > 1), dichroism /
polarizers (κ differs between the two waves), birefringence / wave plates (n differs), and optical
activity (n differs between left- and right-circular components). The superposition of the two waves
shows how polarization states combine and transform.

The model is a faithful port of **EMANIM** (Electromagnetic Waves Animated) by András Szilágyi
(<https://emanim.szialab.org>), which is the source of the equations, control ranges, and the 20
preset phenomena on the Lab screen. Both the classic Python EMANIM and the current web app were used
to cross-validate the equations.

## Quantities and units

The model uses EMANIM's dimensionless units with the wave speed c = 1; they are **not** SI units.
Distances along the propagation axis are "axis units" (the visible axis spans x ∈ [−8π, +8π],
sampled at 289 points, step π/18), and time is measured so that the vacuum phase is x/ƛ − t/ƛ.

| Quantity | Symbol | Control → model mapping | Range (control) |
|---|---|---|---|
| Amplitude | A | direct | 0 – 10, step 1, default 5 |
| Wavelength number | w | reduced wavelength ƛ = w/4, wavelength λ = w·π/2 | 1 – 8 (integer), default 4 |
| Phase difference (wave 2) | δ | degrees → radians | −180° – 180°, step 10°, default 0° |
| Material length number | m | slab length L = m·π/2 | 1 – 32 (integer), default 16 |
| Refractive index (per wave) | n | direct | 1.00 – 2.00, step 0.05, default 1.00 |
| Extinction coefficient (per wave) | κ | direct | 0.00 – 1.00, step 0.05, default 0.00 |
| Time | t | advances π/18 axis units per 1/30 s at normal speed (TIME_SCALE = 30π/18 ≈ 5.236 axis units/s) | — |

## Governing equations

Angular frequency: ω = 1/ƛ. A wave normally travels toward +x; "Reverse direction" (wave 1) flips
it, which the model expresses through the propagation coordinate **ξ = d·x** with direction sign
d = ±1 (so slab-entry comparisons on ξ automatically mirror for reversed waves). The slab, when
inserted, occupies ξ ∈ [ξ_in, ξ_out] with ξ_in = −L/2 and ξ_out = +L/2.

Each wave's field is A·D·sin(Φ) with region-dependent phase Φ and decay D:

| Region | Phase Φ | Decay D |
|---|---|---|
| Before the slab (ξ < ξ_in), or no slab | ξ/ƛ − ωt + δ | 1 |
| Inside (ξ_in ≤ ξ < ξ_out) | n·ξ/ƛ − ωt + δ + φₐ | exp(−κ·(ξ − ξ_in)/π) |
| After (ξ ≥ ξ_out) | ξ/ƛ − ωt + δ + φ_b | exp(−κ·L/π) |

The offsets make the phase continuous at both interfaces:

- **φₐ = ξ_in·(1 − n)/ƛ** — at ξ = ξ_in the inside phase n·ξ_in/ƛ + φₐ equals the outside phase
  ξ_in/ƛ.
- **φ_b = (n − 1)·L/ƛ** — at ξ = ξ_out the after phase ξ_out/ƛ + φ_b equals the inside phase
  n·ξ_out/ƛ + φₐ (substitute ξ_in = −L/2, ξ_out = +L/2). φ_b is the **retardation** the slab
  imposes: the extra phase accumulated by traveling L at reduced speed c/n.

### Polarization components

y is the vertical transverse axis and z the other transverse axis. The signs mirror the EMANIM web
app verbatim (see Simplifications):

| Polarization | e_y | e_z |
|---|---|---|
| Vertical | A·D·sin Φ | 0 |
| Horizontal | 0 | −A·D·sin Φ |
| Left circular | A·D·sin(Φ − π/2) | A·D·sin Φ |
| Right circular | A·D·sin(Φ + π/2) | A·D·sin Φ |

The displayed **sum** is the componentwise sum of the two waves' fields. A **standing wave** is
wave 1 reversed plus wave 2 forward at equal wavelength.

### Magnetic field (extension over EMANIM)

Each wave's B-field is drawn as B = d·(0, −e_z, e_y), i.e. k̂ × E for the wave's travel direction,
display-scaled to the same amplitude as E. B is perpendicular to E by construction and flips sign
when the wave is reversed.

### One material, many optical elements

Because n and κ are per wave, a single slab models:

- **Absorber** — κ₁ > 0 for a single wave.
- **Refractive medium** — n₁ > 1: shorter wavelength and slower phase speed inside, phase jump
  φ_b after.
- **Polarizer (linear dichroism)** — vertical + horizontal basis with κ₁ ≠ κ₂: one component is
  absorbed, the transmitted sum becomes linearly polarized along the surviving axis.
- **Wave plate (linear birefringence)** — vertical + horizontal basis with n₁ ≠ n₂: the components
  are retarded relative to each other by Δφ = (n₁ − n₂)·L/ƛ = 2π(n₁ − n₂)L/λ. Δφ = π/2 (quarter-wave
  plate) turns 45° linear light circular; Δφ = π (half-wave plate) mirrors the polarization plane.
- **Optically active medium (circular birefringence)** — left + right circular basis with n₁ ≠ n₂:
  the transmitted linear polarization plane is rotated by Δφ/2.
- **Circular dichroism** — circular basis with κ₁ ≠ κ₂: transmitted light becomes elliptical.

The Wave Plates screen's preset buttons use exact on-grid values at w = 4 (ƛ = 1): quarter-wave =
{m = 20, n₁ = 1.05, n₂ = 1.00} → Δφ = π/2, and half-wave = {m = 20, n₁ = 1.10, n₂ = 1.00} → Δφ = π.
(The default m = 16 cannot reach π/2 exactly with 0.05 index steps.)

## Simplifications and assumptions

- **Extinction law**: the decay D = exp(−κ·Δx/π) is EMANIM's form and is **wavelength-independent**,
  kept for exact parity with EMANIM. The physical Beer–Lambert/complex-index law would be
  D = exp(−κ·ω·Δx) = exp(−κ·Δx/ƛ), i.e. EMANIM's form with the fixed length scale π in place of the
  wavelength-dependent ƛ. Qualitatively nothing changes; quantitatively, absorption here does not
  strengthen at shorter wavelengths.
- **No interface reflections**: Fresnel reflection and transmission losses at the slab faces are
  ignored — waves enter and exit with unchanged amplitude (apart from κ decay).
- **B not n-scaled**: inside a medium the physical B amplitude is n·E/c; the sim draws B with the
  same amplitude as E everywhere (it is a direction/phase visual aid, not a magnitude readout).
- **Sign conventions**: the horizontal component's sign (e_z = −A·D·sin Φ) and the circular
  handedness assignments mirror the EMANIM web app exactly rather than any particular optics
  textbook convention. Handedness naming varies across the literature; what matters physically is
  that the two circular polarizations are mutually opposite, 90° apart in phase.
- The two waves are collinear plane waves with a shared transverse basis; there is no beam
  geometry, diffraction, or partial coherence.

## References

- A. Szilágyi, *EMANIM: Interactive visualization of electromagnetic waves* — web app
  (<https://emanim.szialab.org>) and classic Python source
  (<https://emanimclassic.szialab.org>). The model equations, control ranges, presets, and camera
  presets are ported from these, with the magnetic-field display added.
- E. Hecht, *Optics* (5th ed.), ch. 8 — polarization, dichroism, birefringence, optical activity.
