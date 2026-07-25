import { render, screen } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { current } = vi.hoisted(() => ({ current: vi.fn() }));
vi.mock("@/api/announcement", () => ({ announcementApi: { current } }));

import CurrentAnnouncement from "./CurrentAnnouncement.vue";

const renderSubject = () => render(CurrentAnnouncement, {
  global: {
    stubs: {
      RouterLink: { props: ["to"], template: "<a href='#'><slot /></a>" },
    },
  },
});

describe("CurrentAnnouncement", () => {
  beforeEach(() => current.mockReset());

  it("shows the highest-priority current announcement", async () => {
    current.mockResolvedValue({ data: [{ id: 12, title: "判题集群维护", pinned: true }] });
    renderSubject();

    expect(await screen.findByRole("link", { name: /判题集群维护/ })).toBeVisible();
    expect(current).toHaveBeenCalledWith(1);
  });

  it("does not reserve an empty banner when no announcement is current", async () => {
    current.mockResolvedValue({ data: [] });
    const { container } = renderSubject();

    await vi.waitFor(() => expect(current).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
