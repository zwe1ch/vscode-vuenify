# Vuenify

Opinionated Vue SFC formatter for `<template>` blocks.

Vuenify focuses on **deterministic attribute formatting** inside Vue Single File Components:

- Sort static `class` attributes
- Normalize Vue directives (`v-bind`, `v-on`, `v-slot`)
- Order directives by priority
- Order attributes (value first, then boolean)
- Stable, idempotent formatting
- Safe SFC offset handling (script/style untouched)

It formats **only the structure of attributes and directives inside `<template>`**.

It does **not**:

- Format JavaScript
- Format CSS
- Re-indent markup
- Replace your general-purpose formatter

Vuenify can be used in three ways:

- 🔧 As a **Source Action** (runs on save after formatting)
- 🧩 As the **default Vue formatter**
- ▶️ Manually via command palette commands

---

## ✨ Features

### 1️⃣ Sort Static Classes

Sort static `class` attributes alphabetically and optionally remove duplicates.

**Before**

```vue
<div class="b a b c"></div>
```

**After**

```vue
<div class="a b c"></div>
```

Controlled by:

- `vuenify.classes.sort`
- `vuenify.classes.removeDuplicates`
- `vuenify.classes.layout`

---

### 2️⃣ Normalize Vue Directives

Convert between long and shorthand forms:

- `v-bind:foo` ↔ `:foo`
- `v-on:click` ↔ `@click`
- `v-slot:header` ↔ `#header`

**Before**

```vue
<div v-bind:foo="bar" v-on:click="handle"></div>
```

**After (short mode)**

```vue
<div :foo="bar" @click="handle"></div>
```

Supports:

- Modifiers (`.stop`, `.prevent`, `.camel`)
- Dynamic arguments (`v-bind:[foo]`)
- Same-name bindings (`:src="src"`)

Controlled by:

- `vuenify.directives.normalize`
- `vuenify.directives.style`
- `vuenify.directives.sameName`

---

### 3️⃣ Directive Ordering

Directives are ordered by configurable priority.

**Default priority**

```json
["if", "else", "else-if", "for", "on", "model", "bind"]
```

**Before**

```vue
<div v-bind="a" v-if="visible" v-model="value"></div>
```

**After**

```vue
<div v-if="visible" v-model="value" v-bind="a"></div>
```

Controlled by:

- `vuenify.order.directives`
- `vuenify.order.directivePriority`

Unknown directives are sorted alphabetically after prioritized ones.

---

### 4️⃣ Attribute Ordering

Non-directive attributes can be sorted:

- Attributes **with values first**
- Boolean attributes after
- Alphabetical within groups

**Before**

```vue
<input disabled type="text" id="field" />
```

**After**

```vue
<input id="field" type="text" disabled />
```

Controlled by:

- `vuenify.order.attributes`
- `vuenify.order.layout`

---

### 5️⃣ Deterministic Tag Rebuild

Opening tags are fully rebuilt to guarantee:

- Deterministic output
- Idempotent formatting
- No partial rewrites
- Stable ordering

Script and style blocks are never modified.

---

## 🚀 Usage & Setup

You can configure Vuenify either:

- via the **Settings UI** (search for “Vuenify”), or
- in `settings.json` (recommended when you want to copy/paste configs)

---

### Option 1 — Source Action Mode

Run Vuenify as a structural pass on save.

```json
"[vue]": {
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.vuenify": "always"
  }
}
```

This works independently of whichever formatter you use.

If another formatter is configured, it runs first.
Vuenify runs afterwards as a structural normalization step.

---

### Option 2 — Use as Default Vue Formatter

Let Vuenify handle Vue formatting directly:

```json
"[vue]": {
  "editor.defaultFormatter": "zwe1ch.vuenify",
  "editor.formatOnSave": true
}
```

---

### Option 3 — Manual Commands

Available in the Command Palette:

- **Vuenify: Sort Classes**
- **Vuenify: Normalize Directives**
- **Vuenify: Order Attributes & Directives**

---

## ⚙️ Settings

All settings are defined under the `Vuenify` namespace.

---

### `vuenify.classes.sort`

**Type:** `boolean`
**Default:** `true`

Sort static `class` attributes alphabetically.

---

### `vuenify.classes.removeDuplicates`

**Type:** `boolean`
**Default:** `true`

Remove duplicate class names.

---

### `vuenify.classes.layout`

**Type:** `"inline" | "preserve"`
**Default:** `"inline"`

Controls how class attribute whitespace is handled.

- `inline` → Always rebuild as single-line class attribute
- `preserve` → Keep original internal whitespace

---

### `vuenify.directives.normalize`

**Type:** `boolean`
**Default:** `true`

Normalize supported Vue directives.

---

### `vuenify.directives.style`

**Type:** `"short" | "long"`
**Default:** `"short"`

Directive style to use when normalizing.

- `short` → `:foo`, `@click`
- `long` → `v-bind:foo`, `v-on:click`

---

### `vuenify.directives.sameName`

**Type:** `"ignore" | "removeValue" | "addValue"`
**Default:** `"ignore"`

Controls handling of same-name bindings:

```vue
<img :src="src" />
```

Options:

- `ignore`
- `removeValue` → `:src`
- `addValue` → `v-bind:src="src"`

---

### `vuenify.order.directives`

**Type:** `boolean`
**Default:** `true`

Enable directive ordering.

---

### `vuenify.order.directivePriority`

**Type:** `string[]`
**Default:**

```json
["if", "else", "else-if", "for", "on", "model", "bind"]
```

Custom priority order for Vue directives.

---

### `vuenify.order.attributes`

**Type:** `boolean`
**Default:** `true`

Sort non-directive attributes (value first, then boolean).

---

### `vuenify.order.layout`

**Type:** `"inline" | "preserve"`
**Default:** `"inline"`

Controls whitespace handling when attributes are reordered.

- `inline` → All attributes rebuilt into a single line
- `preserve` → Preserve existing line breaks

---

## 🧠 Design Principles

- Deterministic output
- Idempotent formatting
- No partial attribute rewrites
- Safe SFC parsing via `@vue/compiler-sfc`
- Stable sorting behavior
- Script & style blocks untouched

---

## 📄 License

MIT
