import * as assert from "assert";

import { applyEdits } from "../utils/applyEdits";
import { vuenifyTransform } from "../../transformer";

suite("Template offset handling", () => {
  const opts = {
    attributeLayout: "inline" as const,
    classLayout: "inline" as const,
    directiveOrder: ["if", "else", "else-if", "for", "on", "model", "bind"],
    directiveStyle: "short" as const,
    normalizeDirectives: true,
    orderAttributes: true,
    orderDirectives: true,
    removeDuplicates: true,
    sameNameMode: "ignore" as const,
    sortClasses: true
  };

  test("preserves script and style blocks", () => {
    const source = `
<script>
export default {}
</script>

<template>
  <div class="b a"></div>
</template>
`;

    const transformed = applyEdits(source, vuenifyTransform(source, opts));

    assert.ok(transformed.includes("<script>"));
    assert.ok(transformed.includes('class="a b"'));
  });

  test("does nothing if no template block exists", () => {
    const source = `
<script>
export default {}
</script>
`;

    assert.strictEqual(vuenifyTransform(source, opts).length, 0);
  });

  test("fails gracefully on malformed template", () => {
    const source = `
<template>
  <div
</template>
`;

    assert.strictEqual(vuenifyTransform(source, opts).length, 0);
  });
});
