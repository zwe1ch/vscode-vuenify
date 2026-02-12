import * as vscode from "vscode";

import { AttributeLayout, ClassLayout, DirectiveStyle, SameNameMode } from "./types";

import { vuenifyTransform } from "./transformer";

export function activate(context: vscode.ExtensionContext) {
  /**
   * Reads all configuration values from the "vuenify" namespace.
   * This is the single source of truth for runtime options.
   */
  const getOptions = () => {
    const config = vscode.workspace.getConfiguration("vuenify");

    return {
      attributeLayout: config.get<AttributeLayout>("order.layout", "inline"),
      classLayout: config.get<ClassLayout>("classes.layout", "inline"),
      directiveOrder: config.get<string[]>("order.directivePriority", ["if", "else", "else-if", "for", "on", "model", "bind"]),
      directiveStyle: config.get<DirectiveStyle>("directives.style", "short"),
      normalizeDirectives: config.get<boolean>("directives.normalize", true),
      orderAttributes: config.get<boolean>("order.attributes", true),
      orderDirectives: config.get<boolean>("order.directives", true),
      removeDuplicates: config.get<boolean>("classes.removeDuplicates", true),
      sameNameMode: config.get<SameNameMode>("directives.sameName", "ignore"),
      sortClasses: config.get<boolean>("classes.sort", true)
    };
  };

  /**
   * Applies text edits directly to the active editor.
   * Used by manual commands.
   */
  function applyEdits(editor: vscode.TextEditor, optionsOverride?: Partial<ReturnType<typeof getOptions>>) {
    const options = {
      ...getOptions(),
      ...optionsOverride
    };

    const edits = vuenifyTransform(editor.document.getText(), options);

    return editor.edit((builder) => {
      for (const r of edits) {
        builder.replace(new vscode.Range(editor.document.positionAt(r.start), editor.document.positionAt(r.end)), r.value);
      }
    });
  }

  /**
   * Builds VS Code TextEdit objects for formatter integration.
   * Used by document formatting providers and source actions.
   */
  function buildTextEdits(document: vscode.TextDocument) {
    const edits = vuenifyTransform(document.getText(), getOptions());

    return edits.map((r) => new vscode.TextEdit(new vscode.Range(document.positionAt(r.start), document.positionAt(r.end)), r.value));
  }

  /**
   * ------------------------------------------------
   * COMMANDS
   * ------------------------------------------------
   */

  /**
   * Command: Vuenify: Sort Classes
   * Only applies class sorting logic.
   * Other formatting features are disabled explicitly.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("vuenify.sortClasses", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "vue") {
        return;
      }

      await applyEdits(editor, {
        normalizeDirectives: false,
        orderDirectives: false,
        orderAttributes: false
      });
    })
  );

  /**
   * Command: Vuenify: Normalize Directives
   * Only applies directive normalization.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("vuenify.normalizeDirectives", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "vue") {
        return;
      }

      await applyEdits(editor, {
        sortClasses: false,
        orderDirectives: false,
        orderAttributes: false
      });
    })
  );

  /**
   * Command: Vuenify: Order Attributes & Directives
   * Only applies ordering logic.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("vuenify.orderAttributesAndDirectives", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "vue") {
        return;
      }

      await applyEdits(editor, {
        sortClasses: false,
        normalizeDirectives: false
      });
    })
  );

  /**
   * ------------------------------------------------
   * DOCUMENT FORMATTER
   * ------------------------------------------------
   */

  /**
   * Full document formatter integration.
   * Enables usage via:
   * - "Format Document"
   * - formatOnSave when this extension is the default formatter.
   */
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { language: "vue", scheme: "file" },
      {
        provideDocumentFormattingEdits(document) {
          return buildTextEdits(document);
        }
      }
    )
  );

  /**
   * Range formatter integration.
   * Currently applies full-template transformation
   * but allows VS Code to invoke range-based formatting.
   */
  context.subscriptions.push(
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      { language: "vue", scheme: "file" },
      {
        provideDocumentRangeFormattingEdits(document) {
          return buildTextEdits(document);
        }
      }
    )
  );

  /**
   * ------------------------------------------------
   * SOURCE CODE ACTION (for codeActionsOnSave)
   * ------------------------------------------------
   */

  /**
   * Registers a Source Code Action:
   * Kind: source.vuenify
   *
   * This enables integration via:
   * editor.codeActionsOnSave
   */
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: "vue", scheme: "file" },
      {
        provideCodeActions(document) {
          const edits = buildTextEdits(document);

          /**
           * Do not register an action if no edits are required.
           */
          if (!edits.length) {
            return;
          }

          const action = new vscode.CodeAction("Vuenify: Format Vue template", vscode.CodeActionKind.Source.append("vuenify"));

          action.edit = new vscode.WorkspaceEdit();

          for (const edit of edits) {
            action.edit.replace(document.uri, edit.range, edit.newText);
          }

          return [action];
        }
      },
      {
        providedCodeActionKinds: [vscode.CodeActionKind.Source.append("vuenify")]
      }
    )
  );
}
