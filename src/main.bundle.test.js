import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(
  resolve(process.cwd(), "src/main.js"),
  "utf8",
);
const editorServiceSource = readFileSync(
  resolve(process.cwd(), "src/services/MonacoEditorService.js"),
  "utf8",
);

describe("application entry bundle boundaries", () => {
  it("does not install the complete Element Plus plugin or icon catalog", () => {
    expect(mainSource).not.toMatch(/import\s+ElementPlus\s+from\s+["']element-plus["']/);
    expect(mainSource).not.toMatch(/import\s+\*\s+as\s+ElementPlusIconsVue/);
    expect(mainSource).not.toContain("app.use(ElementPlus)");
    expect(mainSource).not.toContain("Object.entries(ElementPlusIconsVue)");
  });

  it("loads Monaco's editor API instead of the complete package entry", () => {
    expect(editorServiceSource).not.toContain('import("monaco-editor")');
    expect(editorServiceSource).toContain(
      'import("monaco-editor/esm/vs/editor/editor.api")',
    );
  });
});
