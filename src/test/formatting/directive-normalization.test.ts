import * as assert from "assert";

import { applyEdits } from "../utils/applyEdits";
import { vuenifyTransform } from "../../transformer";

suite("Directive normalization", () => {
  const opts = {
    attributeLayout: "inline" as const,
    classLayout: "inline" as const,
    directiveOrder: ["if", "else", "else-if", "for", "on", "model", "bind"],
    directiveStyle: "short" as const,
    normalizeDirectives: true,
    orderAttributes: true,
    orderDirectives: true,
    removeDuplicates: false,
    sameNameMode: "ignore" as const,
    sortClasses: false
  };

  test("converts v-bind to shorthand", () => {
    const source = `
<template>
  <div v-bind:foo="bar"></div>
</template>
`;

    const expected = `
<template>
  <div :foo="bar"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });

  test("removes same-name value", () => {
    const source = `
<template>
  <img :src="src">
</template>
`;

    const expected = `
<template>
  <img :src>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, sameNameMode: "removeValue" as const })), expected);
  });

  test("removes value for dynamic same-name binding", () => {
    const source = `
<template>
  <div v-bind:[foo]="foo"></div>
</template>
`;

    const expected = `
<template>
  <div :[foo]></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, sameNameMode: "removeValue" as const })), expected);
  });

  test("does not transform v-bind without argument", () => {
    const source = `
<template>
  <div v-bind="obj"></div>
</template>
`;

    assert.ok(applyEdits(source, vuenifyTransform(source, opts)).includes('v-bind="obj"'));
  });
});
