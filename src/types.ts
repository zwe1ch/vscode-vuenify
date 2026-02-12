/**
 * Controls how attributes are separated when reordered.
 *
 * - "inline"   → join attributes with a single space
 * - "preserve" → reuse original multiline spacing if present
 */
export type AttributeLayout = "inline" | "preserve";

/**
 * Controls how class attributes are rebuilt.
 *
 * - "inline"   → single-line output
 * - "preserve" → preserve multiline layout if originally multiline
 */
export type ClassLayout = "inline" | "preserve";

/**
 * Controls how supported Vue directives are rendered.
 *
 * - "short" → :foo, @click, #slot
 * - "long"  → v-bind:foo, v-on:click, v-slot:name
 */
export type DirectiveStyle = "short" | "long";

/**
 * Controls how same-name bindings are handled.
 *
 * Example:
 * :src="src"
 *
 * - "ignore"      → leave unchanged
 * - "removeValue" → :src
 * - "addValue"    → v-bind:src="src"
 */
export type SameNameMode = "ignore" | "removeValue" | "addValue";

/**
 * Public configuration interface.
 *
 * All properties are optional because:
 * - They may come from partial overrides
 * - They are merged with defaults via resolveOptions()
 */
export interface VuenifyOptions {
  attributeLayout?: AttributeLayout;
  classLayout?: ClassLayout;
  directiveOrder?: string[];
  directiveStyle?: DirectiveStyle;
  normalizeDirectives?: boolean;
  orderAttributes?: boolean;
  orderDirectives?: boolean;
  removeDuplicates?: boolean;
  sameNameMode?: SameNameMode;
  sortClasses?: boolean;
}

/**
 * Fully resolved configuration.
 *
 * This is the internal representation used by the transformer.
 * All properties are guaranteed to be defined.
 */
export interface ResolvedVuenifyOptions {
  attributeLayout: AttributeLayout;
  classLayout: ClassLayout;
  directiveOrder: string[];
  directiveStyle: DirectiveStyle;
  normalizeDirectives: boolean;
  orderAttributes: boolean;
  orderDirectives: boolean;
  removeDuplicates: boolean;
  sameNameMode: SameNameMode;
  sortClasses: boolean;
}
