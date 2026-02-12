import { DirectiveStyle, SameNameMode } from "./types";

import { DirectiveNode } from "@vue/compiler-dom";
import { Replacement } from "./transformer";

/**
 * Transforms a single Vue directive node into its normalized form.
 *
 * Returns a Replacement if the raw source string changes,
 * otherwise returns null to avoid unnecessary edits.
 */
export function getDirectiveTransform(prop: DirectiveNode, templateOffset: number, style: DirectiveStyle, sameNameMode: SameNameMode): Replacement | null {
  /**
   * Defensive check:
   * Ensure raw source exists before attempting transformation.
   */
  if (!prop.loc?.source) {
    return null;
  }

  const raw = prop.loc.source;
  const name = prop.name; // bind, on, slot, etc.
  const arg = prop.arg?.loc.source ?? ""; // argument (e.g. foo in v-bind:foo)
  const modifiers = prop.modifiers?.map((m) => m.content).filter(Boolean) ?? [];

  /**
   * Rebuild modifier suffix (e.g. .stop.prevent)
   */
  const modifierStr = modifiers.length ? "." + modifiers.join(".") : "";

  const hasValue = !!prop.exp;

  /**
   * Preserve original value part including:
   * - equal sign
   * - quote style
   * - whitespace
   *
   * This avoids introducing formatting changes unrelated to normalization.
   */
  let originalValuePart = "";

  if (hasValue) {
    const equalIndex = raw.indexOf("=");

    if (equalIndex !== -1) {
      originalValuePart = raw.slice(equalIndex);
    }
  }

  let valuePart = originalValuePart;

  /**
   * Same-name handling for v-bind.
   *
   * Example:
   * :src="src"
   *
   * Modes:
   * - ignore: leave untouched
   * - removeValue: :src
   * - addValue: v-bind:src="src"
   */
  if (name === "bind" && arg && sameNameMode !== "ignore") {
    const isDynamic = arg.startsWith("[") && arg.endsWith("]");
    const normalizedArg = (isDynamic ? arg.slice(1, -1) : arg).trim();

    /**
     * Remove value if expression equals argument.
     */
    if (sameNameMode === "removeValue" && hasValue) {
      const expContent = prop.exp!.loc.source.trim();

      if (expContent === normalizedArg) {
        valuePart = "";
      }
    }

    /**
     * Add value if missing.
     */
    if (sameNameMode === "addValue" && !hasValue) {
      valuePart = `="${normalizedArg}"`;
    }
  }

  /**
   * Build normalized directive string.
   */
  const newDirective = buildDirective(raw, name, arg, modifierStr, valuePart, style);

  /**
   * Only return replacement if something actually changed.
   */
  if (raw !== newDirective) {
    return {
      start: templateOffset + prop.loc.start.offset,
      end: templateOffset + prop.loc.end.offset,
      value: newDirective
    };
  }

  return null;
}

/**
 * Rebuilds directive string depending on configured style.
 * Only supported directives are transformed.
 */
function buildDirective(raw: string, name: string, arg: string, modifierStr: string, valuePart: string, style: DirectiveStyle): string {
  /**
   * Only transform supported directives.
   * All others remain untouched.
   */
  const isSupported = name === "bind" || name === "on" || name === "slot";

  if (!isSupported) {
    return raw;
  }

  /**
   * Short style:
   * v-bind:foo  -> :foo
   * v-on:click  -> @click
   * v-slot:name -> #name
   */
  if (style === "short") {
    if (name === "bind" && arg) {
      return `:${arg}${modifierStr}${valuePart}`;
    }

    if (name === "on" && arg) {
      return `@${arg}${modifierStr}${valuePart}`;
    }

    if (name === "slot" && arg) {
      return `#${arg}${modifierStr}${valuePart}`;
    }
  }

  /**
   * Long style:
   * :foo   -> v-bind:foo
   * @click -> v-on:click
   * #name  -> v-slot:name
   */
  if (style === "long") {
    if (name === "bind" && arg) {
      return `v-bind:${arg}${modifierStr}${valuePart}`;
    }

    if (name === "on" && arg) {
      return `v-on:${arg}${modifierStr}${valuePart}`;
    }

    if (name === "slot" && arg) {
      return `v-slot:${arg}${modifierStr}${valuePart}`;
    }
  }

  /**
   * Fallback:
   * Return original directive if no transformation applied.
   */
  return raw;
}
