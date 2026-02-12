import { AttributeNode, DirectiveNode, ElementNode, NodeTypes } from "@vue/compiler-dom";

import { Replacement } from "./transformer";
import { ResolvedVuenifyOptions } from "./types";
import { getDirectiveTransform } from "./directiveTransform";

/**
 * Local union type representing all possible element props.
 * We only handle static attributes and directives here.
 */
type PropNode = AttributeNode | DirectiveNode;

/**
 * Type guard for static attributes (e.g. id="x").
 */
function isAttributeNode(p: PropNode): p is AttributeNode {
  return p.type === NodeTypes.ATTRIBUTE;
}

/**
 * Type guard for Vue directives (e.g. v-if, :foo, @click).
 */
function isDirectiveNode(p: PropNode): p is DirectiveNode {
  return p.type === NodeTypes.DIRECTIVE;
}

/**
 * Clone attribute node while replacing its raw source string.
 * We preserve all other metadata to avoid breaking AST structure.
 */
function cloneAttributeWithSource(original: AttributeNode, newSource: string): AttributeNode {
  return {
    ...original,
    loc: {
      ...original.loc,
      source: newSource
    }
  };
}

/**
 * Clone directive node while replacing its raw source string.
 * This ensures downstream logic still sees a valid node.
 */
function cloneDirectiveWithSource(original: DirectiveNode, newSource: string): DirectiveNode {
  return {
    ...original,
    loc: {
      ...original.loc,
      source: newSource
    }
  };
}

/**
 * Stable sort implementation to preserve original order
 * when comparison result is equal.
 */
function stableSort<T>(items: readonly T[], compare: (a: T, b: T) => number): T[] {
  return items
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      const result = compare(a.value, b.value);

      return result !== 0 ? result : a.index - b.index;
    })
    .map((x) => x.value);
}

/**
 * ASCII-based comparison for deterministic ordering.
 * Avoids locale-dependent sorting behavior.
 */
function asciiCompare(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

/**
 * Main entry for rebuilding an element's attribute block.
 * If nothing changes, returns null to avoid unnecessary edits.
 */
export function buildUnifiedAttributeReplacement(element: ElementNode, templateOffset: number, options: ResolvedVuenifyOptions): Replacement | null {
  const props: readonly PropNode[] = element.props;

  if (props.length === 0) {
    return null;
  }

  /**
   * Determine how attributes should be joined when rebuilt.
   * Default is single-space separation ("inline").
   */
  const fullContent = element.loc.source;

  let separator = " ";

  /**
   * If attributeLayout is "preserve" and original attributes were multiline,
   * extract the exact whitespace gap between the first two attributes
   * and reuse it when rebuilding.
   */
  if (options.attributeLayout === "preserve" && props.length > 1) {
    const firstEnd = props[0].loc.end.offset - element.loc.start.offset;
    const secondStart = props[1].loc.start.offset - element.loc.start.offset;
    const gap = fullContent.slice(firstEnd, secondStart);

    if (gap.includes("\n")) {
      separator = gap;
    }
  }

  let changed = false;

  /**
   * First pass:
   * - transform classes
   * - normalize directives
   */
  const transformed: PropNode[] = props.map((prop): PropNode => {
    /**
     * CLASS PROCESSING
     *
     * - Split by whitespace
     * - Optionally remove duplicates
     * - Optionally sort
     * - Rebuild while preserving quote style
     */
    if (isAttributeNode(prop) && prop.name === "class" && prop.value && (options.sortClasses || options.removeDuplicates)) {
      const rawValue = prop.value.content;
      const originalSource = prop.loc.source;
      const quote = originalSource.includes("'") ? "'" : '"';

      const classes = rawValue.split(/\s+/).filter(Boolean);

      let processed = classes;

      if (options.removeDuplicates) {
        processed = [...new Set(processed)];
      }

      if (options.sortClasses) {
        processed = [...processed].sort(asciiCompare);
      }

      let rebuiltValue: string;

      /**
       * Preserve multiline layout if requested and originally multiline.
       */
      if (options.classLayout === "preserve" && originalSource.includes("\n")) {
        const indentMatch = originalSource.match(/\n(\s+)/);
        const indent = indentMatch ? indentMatch[1] : "  ";

        rebuiltValue =
          processed[0] +
          processed
            .slice(1)
            .map((c) => `\n${indent}${c}`)
            .join("");
      } else {
        rebuiltValue = processed.join(" ");
      }

      const rebuilt = `class=${quote}${rebuiltValue}${quote}`;

      if (rebuilt !== originalSource) {
        changed = true;

        return cloneAttributeWithSource(prop, rebuilt);
      }
    }

    /**
     * DIRECTIVE NORMALIZATION
     *
     * Delegates transformation to directiveTransform module.
     * Only runs if normalizeDirectives is enabled.
     */
    if (options.normalizeDirectives && isDirectiveNode(prop)) {
      const res = getDirectiveTransform(prop, 0, options.directiveStyle, options.sameNameMode);

      if (res && res.value !== prop.loc.source) {
        changed = true;

        return cloneDirectiveWithSource(prop, res.value);
      }
    }

    return prop;
  });

  let sorted: PropNode[] = [...transformed];

  /**
   * DIRECTIVE ORDERING
   *
   * - Build weight map from configured priority list
   * - Stable sort directives by weight
   * - Unknown directives get fallback weight (1000)
   */
  if (options.orderDirectives) {
    const weightMap = new Map<string, number>();

    options.directiveOrder.forEach((name, index) => {
      weightMap.set(name, index);
    });

    const directives = sorted.filter(isDirectiveNode);

    const sortedDirectives = stableSort(directives, (a, b) => {
      const aWeight = weightMap.has(a.name) ? weightMap.get(a.name)! : 1000;
      const bWeight = weightMap.has(b.name) ? weightMap.get(b.name)! : 1000;

      if (aWeight !== bWeight) {
        return aWeight - bWeight;
      }

      return asciiCompare(a.name, b.name);
    });

    let i = 0;

    sorted = sorted.map((p) => (isDirectiveNode(p) ? sortedDirectives[i++] : p));

    if (!changed) {
      changed = sorted.some((p, idx) => p !== props[idx]);
    }
  }

  /**
   * ATTRIBUTE ORDERING
   *
   * - Attributes with values first
   * - Boolean attributes after
   * - Alphabetical within each group
   */
  if (options.orderAttributes) {
    const attributes = sorted.filter(isAttributeNode);

    const sortedAttributes = stableSort(attributes, (a, b) => {
      const aHasValue = !!a.value;
      const bHasValue = !!b.value;

      if (aHasValue !== bHasValue) {
        return aHasValue ? -1 : 1;
      }

      return asciiCompare(a.name, b.name);
    });

    let i = 0;

    sorted = sorted.map((p) => (isAttributeNode(p) ? sortedAttributes[i++] : p));

    if (!changed) {
      changed = sorted.some((p, idx) => p !== props[idx]);
    }
  }

  /**
   * If no transformation or reordering happened, skip edit.
   */
  if (!changed) {
    return null;
  }

  /**
   * Compute exact source range covering the full attribute block.
   */
  const first = props[0];
  const last = props[props.length - 1];

  const start = templateOffset + first.loc.start.offset;
  const end = templateOffset + last.loc.end.offset;

  /**
   * Rebuild attributes using computed separator.
   */
  const newValue = sorted.map((p) => p.loc.source).join(separator);

  return {
    start,
    end,
    value: newValue
  };
}
