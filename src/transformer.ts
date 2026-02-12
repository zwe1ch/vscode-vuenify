import { ElementNode, NodeTypes, RootNode, TemplateChildNode, parse as parseDom } from "@vue/compiler-dom";
import { ResolvedVuenifyOptions, VuenifyOptions } from "./types";

import { buildUnifiedAttributeReplacement } from "./attributeFormatter";
import { parse as parseSfc } from "@vue/compiler-sfc";
import { resolveOptions } from "./options";

/**
 * Represents a text replacement inside the original source string.
 *
 * start/end are absolute offsets relative to the full SFC source.
 */
export interface Replacement {
  start: number;
  end: number;
  value: string;
}

/**
 * Type guard for Vue element nodes (<div>, <input>, etc.)
 */
function isElementNode(node: TemplateChildNode): node is ElementNode {
  return node.type === NodeTypes.ELEMENT;
}

/**
 * Runtime check to determine whether a node has children.
 * Not all TemplateChildNode variants contain a children array.
 */
function hasChildren(node: TemplateChildNode): node is TemplateChildNode & { children: TemplateChildNode[] } {
  const maybe = node as unknown as { children?: unknown };

  return Array.isArray(maybe.children);
}

/**
 * Main transformation entry point.
 *
 * - Parses the SFC
 * - Extracts the <template> block
 * - Walks the template AST
 * - Collects deterministic attribute replacements
 *
 * Returns a list of text replacements to apply.
 */
export function vuenifyTransform(source: string, options?: VuenifyOptions): Replacement[] {
  /**
   * Ensure a fully resolved configuration object
   */
  const opts: ResolvedVuenifyOptions = resolveOptions(options);

  /**
   * Parse full SFC (script/template/style separation)
   */
  const { descriptor } = parseSfc(source);
  const template = descriptor.template;

  /**
   * If no template exists or it's empty, nothing to transform
   */
  if (!template || !template.content || !template.content.trim()) {
    return [];
  }

  /**
   * Compute absolute offset of template content inside the SFC.
   *
   * The DOM parser only sees template.content.
   * We must map node offsets back to the original file.
   */
  const contentStartOffset = template.loc.start.offset + template.loc.source.indexOf(template.content);

  const replacements: Replacement[] = [];

  /**
   * Recursive AST traversal.
   *
   * For each element node:
   * - Attempt attribute transformation
   * - Collect replacement if needed
   */
  const walk = (node: TemplateChildNode): void => {
    if (isElementNode(node)) {
      const res = buildUnifiedAttributeReplacement(node, contentStartOffset, opts);

      if (res) {
        replacements.push(res);
      }
    }

    /**
     * Continue traversal for nested nodes
     */
    if (hasChildren(node)) {
      node.children.forEach(walk);
    }
  };

  try {
    /**
     * Parse template content into DOM AST
     */
    const ast: RootNode = parseDom(template.content);

    /**
     * Defensive check: ensure valid children array
     */
    if (!Array.isArray(ast.children)) {
      return [];
    }

    /**
     * Start recursive walk
     */
    ast.children.forEach(walk);
  } catch {
    /**
     * Parsing errors should not break the editor.
     * Fail silently and return no edits.
     */
    return [];
  }

  return replacements;
}
