/**
 * PolarizationType.ts
 *
 * The four polarization states a wave can have, matching EMANIM's options.
 * Kept as a string union (rather than an Enumeration) so it serializes
 * directly into preset/permalink state and StringUnionProperty.
 */

export const PolarizationTypeValues = ["vertical", "horizontal", "leftCircular", "rightCircular"] as const;

export type PolarizationType = (typeof PolarizationTypeValues)[number];

export function isPolarizationType(value: string): value is PolarizationType {
  return (PolarizationTypeValues as readonly string[]).includes(value);
}
