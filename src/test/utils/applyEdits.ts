import { Replacement } from "../../transformer";

/**
 * Applies text replacements in reverse order
 * to avoid offset shifting during string mutation.
 */
export const applyEdits = (source: string, edits: Replacement[]): string => [...edits].sort((a, b) => b.start - a.start).reduce((str, r) => str.slice(0, r.start) + r.value + str.slice(r.end), source);
