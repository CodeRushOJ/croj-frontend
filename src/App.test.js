import { render } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@/i18n";
import { useAuthStore } from "@/store/modules/auth";
import App from "./App.vue";

describe("application auth hydration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not refetch the current user after the route guard hydrated it", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const auth = useAuthStore();
    auth.token = "persisted-token";
    auth.user = { id: 7, username: "admin", role: 2 };
    const fetchCurrentUser = vi.spyOn(auth, "fetchCurrentUser");

    render(App, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          "el-config-provider": {
            template: "<div><slot /></div>",
          },
          "router-view": true,
        },
      },
    });
    await nextTick();

    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });
});
