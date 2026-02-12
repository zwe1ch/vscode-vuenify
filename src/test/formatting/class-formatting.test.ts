import * as assert from "assert";

import { applyEdits } from "../utils/applyEdits";
import { vuenifyTransform } from "../../transformer";

suite("Class formatting", () => {
  const opts = {
    attributeLayout: "inline" as const,
    classLayout: "inline" as const,
    directiveOrder: ["if", "else", "else-if", "for", "on", "model", "bind"],
    directiveStyle: "short" as const,
    normalizeDirectives: false,
    orderAttributes: false,
    orderDirectives: false,
    removeDuplicates: true,
    sameNameMode: "ignore" as const,
    sortClasses: true
  };

  test("sorts classes alphabetically", () => {
    const source = `
<template>
  <div class="b a c"></div>
</template>
`;

    const expected = `
<template>
  <div class="a b c"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });

  test("removes duplicate classes even if sorting disabled", () => {
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

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, sortClasses: false })), expected);
  });

  test("does nothing when both sortClasses and removeDuplicates are false", () => {
    const source = `
<template>
  <div class="b a b"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, sortClasses: false, removeDuplicates: false })), source);
  });

  test("is idempotent", () => {
    // Running twice must produce identical output.

    const source = `
<template>
  <div class="c b a"></div>
</template>
`;

    const once = applyEdits(source, vuenifyTransform(source, opts));
    const twice = applyEdits(once, vuenifyTransform(once, opts));

    assert.strictEqual(once, twice);
  });

  test("preserves multiline whitespace while sorting", () => {
    const source = `
<template>
  <div
    class="top-bar
      mb-10
      d-flex
      align-center">
  </div>
</template>
`;

    const expected = `
<template>
  <div
    class="align-center
      d-flex
      mb-10
      top-bar">
  </div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, classLayout: "preserve" as const })), expected);
  });

  test("is idempotent in preserve mode", () => {
    const source = `
<template>
  <div
    class="b
      a">
  </div>
</template>
`;

    const once = applyEdits(source, vuenifyTransform(source, { ...opts, classLayout: "preserve" as const }));
    const twice = applyEdits(once, vuenifyTransform(once, { ...opts, classLayout: "preserve" as const }));

    assert.strictEqual(once, twice);
  });
});
