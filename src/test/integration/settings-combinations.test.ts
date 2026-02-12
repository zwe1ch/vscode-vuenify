import * as assert from "assert";

import { applyEdits } from "../utils/applyEdits";
import { vuenifyTransform } from "../../transformer";

suite("Settings combinations", () => {
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

  test("deduplicates classes even if sortClasses is false", () => {
    // removeDuplicates must work independently of sorting

    const source = `
<template>
  <div class="b a b c"></div>
</template>
`;

    const expected = `
<template>
  <div class="b a c"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, sortClasses: false, removeDuplicates: true, normalizeDirectives: false, orderDirectives: false, orderAttributes: false })), expected);
  });

  test("keeps class order when sorting disabled but removes duplicates (preserve layout)", () => {
    const source = `
<template>
  <div
    class="a
      b
      a
      c">
  </div>
</template>
`;

    const expected = `
<template>
  <div
    class="a
      b
      c">
  </div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, sortClasses: false, removeDuplicates: true, normalizeDirectives: false, orderDirectives: false, orderAttributes: false, classLayout: "preserve" as const })), expected);
  });

  test("does nothing when both sortClasses and removeDuplicates are false", () => {
    const source = `
<template>
  <div class="b a b"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, sortClasses: false, removeDuplicates: false, normalizeDirectives: false, orderDirectives: false, orderAttributes: false })), source);
  });

  test("does not normalize directives when normalizeDirectives is false", () => {
    const source = `
<template>
  <div v-bind:foo="foo" v-if="visible"></div>
</template>
`;

    const expected = `
<template>
  <div v-if="visible" v-bind:foo="foo"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, normalizeDirectives: false, sortClasses: false, removeDuplicates: false, orderDirectives: true, orderAttributes: false })), expected);
  });

  test("directiveStyle long + orderDirectives true produces stable order", () => {
    const source = `
<template>
  <div :foo="bar" @click="onClick"></div>
</template>
`;

    const expected = `
<template>
  <div v-on:click="onClick" v-bind:foo="bar"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, directiveStyle: "long" as const, sameNameMode: "ignore" as const, sortClasses: false, removeDuplicates: false })), expected);
  });

  test("is idempotent under mixed configuration", () => {
    // Running twice must produce identical output.

    const source = `
<template>
  <div
    v-bind:foo="foo"
    v-if="visible"
    class="b a b"
  ></div>
</template>
`;

    const once = applyEdits(source, vuenifyTransform(source, { ...opts, directiveStyle: "short" as const, sameNameMode: "removeValue" as const, classLayout: "inline" as const, attributeLayout: "inline" as const }));
    const twice = applyEdits(once, vuenifyTransform(once, { ...opts, directiveStyle: "short" as const, sameNameMode: "removeValue" as const, classLayout: "inline" as const, attributeLayout: "inline" as const }));

    assert.strictEqual(once, twice);
  });

  test("preserves original multiline attribute layout when attributeLayout is preserve", () => {
    const source = `
<template>
  <div
    id="a"
    class="b"
  ></div>
</template>
`;

    const expected = `
<template>
  <div
    class="b"
    id="a"
  ></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, attributeLayout: "preserve" as const })), expected);
  });

  test("uses inline attribute separator when attributeLayout is inline", () => {
    const source = `
<template>
  <div
    id="a"
    class="b"
  ></div>
</template>
`;

    const expected = `
<template>
  <div
    class="b" id="a"
  ></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, attributeLayout: "inline" as const })), expected);
  });

  test("unknown directives are placed after prioritized ones", () => {
    const source = `
<template>
  <div v-custom="x" v-if="y"></div>
</template>
`;

    const expected = `
<template>
  <div v-if="y" v-custom="x"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });
});
