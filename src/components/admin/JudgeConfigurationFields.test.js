import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import JudgeConfigurationFields from "./JudgeConfigurationFields.vue";

const exactAcm = {
  judgeMode: 0,
  checker: "exact",
  totalScore: null,
  specialJudgeLanguage: "cpp",
  specialJudgeCode: "",
};

const renderFields = (modelValue = exactAcm) => render(JudgeConfigurationFields, {
  props: {
    modelValue,
    "onUpdate:modelValue": async (value) => {
      await view.rerender({ modelValue: value });
    },
  },
});

let view;

describe("JudgeConfigurationFields", () => {
  it("keeps scoring mode independent from exact/token/special output checking", async () => {
    view = renderFields();

    expect(screen.getByLabelText("ACM")).toBeChecked();
    expect(screen.getByLabelText("输出校验方式")).toHaveValue("exact");

    await fireEvent.click(screen.getByLabelText("OI"));
    expect(screen.getByLabelText("OI")).toBeChecked();
    expect(screen.getByLabelText("输出校验方式")).toHaveValue("exact");
    expect(screen.getByLabelText("OI 总分")).toHaveValue(100);

    await fireEvent.update(screen.getByLabelText("输出校验方式"), "token");
    expect(screen.getByLabelText("OI")).toBeChecked();
    expect(screen.getByLabelText("输出校验方式")).toHaveValue("token");
  });

  it("shows checker source fields only for special and clears them when leaving special", async () => {
    view = renderFields({
      judgeMode: 0,
      checker: "special",
      totalScore: null,
      specialJudgeLanguage: "go",
      specialJudgeCode: "package main",
    });

    expect(screen.getByLabelText("特殊判题语言")).toHaveValue("go");
    expect(screen.getByLabelText("特殊判题源码")).toHaveValue("package main");
    expect(screen.getByText(/资源限制由 TestBundle v2/)).toBeVisible();

    await fireEvent.update(screen.getByLabelText("输出校验方式"), "exact");

    expect(screen.queryByLabelText("特殊判题语言")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("特殊判题源码")).not.toBeInTheDocument();
    expect(view.emitted("update:modelValue").at(-1)[0]).toMatchObject({
      checker: "exact",
      specialJudgeLanguage: "cpp",
      specialJudgeCode: "",
    });
  });

  it("renders focused field errors without replacing the administrator draft", () => {
    view = render(JudgeConfigurationFields, {
      props: {
        modelValue: { ...exactAcm, judgeMode: 1, totalScore: 0 },
        errors: [
          { field: "totalScore", message: "OI 总分必须是正整数。" },
        ],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("OI 总分必须是正整数。");
    expect(screen.getByLabelText("OI 总分")).toHaveValue(0);
  });
});
