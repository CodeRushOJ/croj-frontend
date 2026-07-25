import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/community", () => ({
  solutionApi: { list: vi.fn(), create: vi.fn() },
}));

import { solutionApi } from "@/api/community";
import ProblemSolutions from "./ProblemSolutions.vue";

describe("ProblemSolutions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    solutionApi.list.mockResolvedValue({ data: { items: [], total: 0 } });
    solutionApi.create.mockResolvedValue({ data: { id: 12 } });
  });

  it("publishes a solution and reloads the list", async () => {
    render(ProblemSolutions, { props: { problemId: 1001 } });

    await screen.findByText("暂无题解，分享你的思路吧");
    await fireEvent.click(screen.getByRole("button", { name: "发布题解" }));
    await fireEvent.update(screen.getByLabelText("题解标题"), "双指针的单调性");
    await fireEvent.update(screen.getByLabelText("题解正文"), "证明左右指针不会回退，并补充时间复杂度与边界条件。" );
    await fireEvent.click(screen.getByRole("button", { name: "确认发布" }));

    await waitFor(() => expect(solutionApi.create).toHaveBeenCalledWith(1001, {
      title: "双指针的单调性",
      content: "证明左右指针不会回退，并补充时间复杂度与边界条件。",
    }));
    expect(solutionApi.list).toHaveBeenCalledTimes(2);
  });
});
