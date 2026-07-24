import { describe, expect, it } from "vitest";

import contestListSource from "./ContestList.vue?raw";

describe("ContestList visual contract", () => {
  it("uses the shared warm-neutral accent without purple or green gradients", () => {
    expect(contestListSource).toContain("var(--accent-color)");
    expect(contestListSource).toContain("var(--accent-color-soft)");
    expect(contestListSource).not.toMatch(/#635bff|rgba\(99,\s*91,\s*255|#42d6b3/i);
    expect(contestListSource).not.toMatch(/(?:linear|radial)-gradient/i);
  });
});
