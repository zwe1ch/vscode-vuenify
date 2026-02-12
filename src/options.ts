import { ResolvedVuenifyOptions, VuenifyOptions } from "./types";

/**
 * Default configuration for all Vuenify transformations.
 *
 * These values define the baseline behavior when:
 * - No VS Code settings are provided
 * - The transformer is called programmatically without options
 *
 * This object must stay in sync with:
 * - package.json configuration defaults
 * - documented defaults in README
 */
export const defaultOptions: ResolvedVuenifyOptions = {
  attributeLayout: "inline",
  classLayout: "inline",
  directiveOrder: ["if", "else", "else-if", "for", "on", "model", "bind"],
  directiveStyle: "short",
  normalizeDirectives: true,
  orderAttributes: true,
  orderDirectives: true,
  removeDuplicates: true,
  sameNameMode: "ignore",
  sortClasses: true
};

/**
 * Resolves final options object by merging user-provided
 * partial configuration with defaults.
 *
 * This guarantees that the transformer always receives
 * a fully defined ResolvedVuenifyOptions object.
 */
export function resolveOptions(options?: VuenifyOptions): ResolvedVuenifyOptions {
  return {
    ...defaultOptions,
    ...options
  };
}
