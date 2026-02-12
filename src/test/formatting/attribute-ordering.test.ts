import * as assert from "assert";

import { applyEdits } from "../utils/applyEdits";
import { vuenifyTransform } from "../../transformer";

suite("Directive and attribute ordering", () => {
  const opts = {
    attributeLayout: "inline" as const,
    classLayout: "inline" as const,
    directiveOrder: ["if", "else", "else-if", "for", "on", "model", "bind"],
    directiveStyle: "short" as const,
    normalizeDirectives: false,
    orderAttributes: true,
    orderDirectives: true,
    removeDuplicates: false,
    sameNameMode: "ignore" as const,
    sortClasses: false
  };

  test("orders directives by configured priority", () => {
    const source = `
<template>
  <div v-bind="a" v-if="x" v-model="y"></div>
</template>
`;

    const expected = `
<template>
  <div v-if="x" v-model="y" v-bind="a"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });

  test("places unknown directives after prioritized ones", () => {
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

  test("orders value attributes before boolean attributes", () => {
    const source = `
<template>
  <input disabled type="text" id="x">
</template>
`;

    const expected = `
<template>
  <input id="x" type="text" disabled>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, opts)), expected);
  });

  test("does not reorder directives when orderDirectives is false", () => {
    const source = `
<template>
  <div v-bind="a" v-if="x" v-model="y"></div>
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, orderDirectives: false })), source);
  });

  test("does not reorder attributes when orderAttributes is false", () => {
    const source = `
<template>
  <input disabled type="text" id="x">
</template>
`;

    assert.strictEqual(applyEdits(source, vuenifyTransform(source, { ...opts, orderAttributes: false })), source);
  });
});
