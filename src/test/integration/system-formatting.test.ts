import * as assert from "assert";

import { applyEdits } from "../utils/applyEdits";
import { vuenifyTransform } from "../../transformer";

suite("Full formatting integration", () => {
  const opts = {
    attributeLayout: "inline" as const,
    classLayout: "inline" as const,
    directiveOrder: ["if", "else", "else-if", "for", "on", "model", "bind"],
    directiveStyle: "short" as const,
    normalizeDirectives: true,
    orderAttributes: true,
    orderDirectives: true,
    removeDuplicates: true,
    sameNameMode: "removeValue" as const,
    sortClasses: true
  };

  test("formats classes, directives and attributes together", () => {
    // Full pipeline test: normalization + ordering + class sorting

    const source = `
<template>
  <div
    v-bind:foo="foo"
    v-if="visible"
    id="x"
    class="b a b"
    disabled
  >
  </div>
</template>
`;

    const expected = `
<template>
  <div
    v-if="visible" :foo class="a b" id="x" disabled
  >
  </div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });

  test("is idempotent when all modules are active", () => {
    // Formatting must stabilize after first run

    const source = `
<template>
  <div v-bind:foo="foo" v-if="visible" class="b a b"></div>
</template>
`;

    const once = applyEdits(source, vuenifyTransform(source, opts));
    const twice = applyEdits(once, vuenifyTransform(once, opts));

    assert.strictEqual(once, twice);
  });

  test("handles complex element with mixed directives and attributes", () => {
    const source = `
<template>
  <input
    v-model="value"
    v-bind:type="inputType"
    required
    id="field"
    class="z y x"
  >
</template>
`;

    const expected = `
<template>
  <input
    v-model="value" :type="inputType" class="x y z" id="field" required
  >
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });

  test("does not normalize directives when normalizeDirectives is false", () => {
    // normalizeDirectives = false
    // BUT orderDirectives = true
    // so directive order still changes

    const source = `
<template>
  <div
    v-bind:foo="foo"
    v-if="visible"
    class="b a"
  >
  </div>
</template>
`;

    const expected = `
<template>
  <div
    v-if="visible" v-bind:foo="foo" class="a b"
  >
  </div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, normalizeDirectives: false })), expected);
  });

  test("formats nested elements recursively", () => {
    // Ensures AST walker correctly processes nested children

    const source = `
<template>
  <div>
    <span class="b a"></span>
  </div>
</template>
`;

    const expected = `
<template>
  <div>
    <span class="a b"></span>
  </div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });

  test("ignores script and style blocks completely", () => {
    // Only template must change

    const source = `
<script>
export default { foo: "bar" }
</script>

<template>
  <div class="b a"></div>
</template>

<style>
div { color: red }
</style>
`;

    const transformed = applyEdits(source, vuenifyTransform(source, opts));

    assert.ok(transformed.includes('class="a b"'));
    assert.ok(transformed.includes("export default"));
    assert.ok(transformed.includes("color: red"));
  });
});
