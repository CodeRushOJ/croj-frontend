<template>
  <section class="judge-fields" aria-labelledby="judge-configuration-title">
    <header>
      <div>
        <p class="eyebrow">JUDGE POLICY</p>
        <h3 id="judge-configuration-title">判题配置</h3>
      </div>
      <p>保存题目会创建新的草稿版本；上传测试包后才能发布。</p>
    </header>

    <div class="field-group">
      <span class="field-label">计分模式</span>
      <div class="segmented" role="radiogroup" aria-label="计分模式">
        <label>
          <input
            type="radio"
            name="judge-mode"
            aria-label="ACM"
            :checked="modelValue.judgeMode === JUDGE_MODES.ACM"
            @change="changeMode(JUDGE_MODES.ACM)"
          />
          <span>ACM</span>
        </label>
        <label>
          <input
            type="radio"
            name="judge-mode"
            aria-label="OI"
            :checked="modelValue.judgeMode === JUDGE_MODES.OI"
            @change="changeMode(JUDGE_MODES.OI)"
          />
          <span>OI</span>
        </label>
      </div>
      <small>ACM 首个失败用例即可终止；OI 执行全部用例并按权重累计。</small>
      <p v-if="errorFor('judgeMode')" class="field-error" role="alert">
        {{ errorFor("judgeMode") }}
      </p>
    </div>

    <label class="field-group">
      <span class="field-label">输出校验方式</span>
      <select
        aria-label="输出校验方式"
        :value="modelValue.checker"
        @change="changeChecker($event.target.value)"
      >
        <option value="exact">Exact · 逐字节规范化比较</option>
        <option value="token">Token · 忽略空白分词比较</option>
        <option value="special">Special · 隔离沙箱内自定义校验</option>
      </select>
      <small>校验方式与 ACM/OI 计分模式相互独立。</small>
      <p v-if="errorFor('checker')" class="field-error" role="alert">
        {{ errorFor("checker") }}
      </p>
    </label>

    <label v-if="modelValue.judgeMode === JUDGE_MODES.OI" class="field-group">
      <span class="field-label">OI 总分</span>
      <input
        aria-label="OI 总分"
        inputmode="numeric"
        type="number"
        min="1"
        max="1000000000"
        :value="modelValue.totalScore"
        @input="update({ totalScore: Number($event.target.value) })"
      />
      <small>必须与 TestBundle v2 中全部 case weight 之和完全一致。</small>
      <p v-if="errorFor('totalScore')" class="field-error" role="alert">
        {{ errorFor("totalScore") }}
      </p>
    </label>

    <div v-if="modelValue.checker === CHECKERS.SPECIAL" class="special-fields">
      <label class="field-group">
        <span class="field-label">特殊判题语言</span>
        <select
          aria-label="特殊判题语言"
          :value="modelValue.specialJudgeLanguage"
          @change="update({ specialJudgeLanguage: $event.target.value })"
        >
          <option v-for="language in CHECKER_LANGUAGES" :key="language" :value="language">
            {{ language }}
          </option>
        </select>
        <p v-if="errorFor('specialJudgeLanguage')" class="field-error" role="alert">
          {{ errorFor("specialJudgeLanguage") }}
        </p>
      </label>

      <label class="field-group field-group--wide">
        <span class="field-label">特殊判题源码</span>
        <textarea
          aria-label="特殊判题源码"
          rows="10"
          spellcheck="false"
          :value="modelValue.specialJudgeCode"
          @input="update({ specialJudgeCode: $event.target.value })"
        />
        <small>
          源码只写入管理员创建的新草稿版本。资源限制由 TestBundle v2 的
          specialJudge 配置决定，并在 Sandbox 中执行。
        </small>
        <p v-if="errorFor('specialJudgeCode')" class="field-error" role="alert">
          {{ errorFor("specialJudgeCode") }}
        </p>
      </label>
    </div>
  </section>
</template>

<script setup>
import {
  CHECKERS,
  CHECKER_LANGUAGES,
  JUDGE_MODES,
} from "@/domain/judgeConfiguration";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  errors: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const update = (patch) => {
  emit("update:modelValue", { ...props.modelValue, ...patch });
};

const changeMode = (judgeMode) => {
  update({
    judgeMode,
    totalScore: judgeMode === JUDGE_MODES.OI
      ? (Number.isSafeInteger(props.modelValue.totalScore) && props.modelValue.totalScore > 0
          ? props.modelValue.totalScore
          : 100)
      : null,
  });
};

const changeChecker = (checker) => {
  update(checker === CHECKERS.SPECIAL
    ? {
        checker,
        specialJudgeLanguage: CHECKER_LANGUAGES.includes(props.modelValue.specialJudgeLanguage)
          ? props.modelValue.specialJudgeLanguage
          : "cpp",
      }
    : {
        checker,
        specialJudgeLanguage: "cpp",
        specialJudgeCode: "",
      });
};

const errorFor = (field) => (
  props.errors.find((entry) => entry.field === field)?.message || ""
);
</script>

<style scoped>
.judge-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin: 8px 0 24px;
  padding: 20px;
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--card-bg) 92%, var(--accent-color) 8%);
}
.judge-fields header {
  grid-column: 1 / -1;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color-light);
}
.judge-fields h3 { margin: 0; font: 600 22px/1.2 ui-serif, Georgia, serif; }
.judge-fields header > p { max-width: 420px; margin: 0; color: var(--text-color-secondary); font-size: 13px; text-align: right; }
.eyebrow { margin: 0 0 5px; color: var(--accent-color); font-size: 10px; font-weight: 800; letter-spacing: .14em; }
.field-group { display: grid; align-content: start; gap: 7px; min-width: 0; }
.field-label { font-weight: 650; color: var(--text-color); }
.field-group small { color: var(--text-color-secondary); line-height: 1.5; }
.field-group select,
.field-group input,
.field-group textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--input-text);
  background: var(--input-bg);
  font: inherit;
}
.field-group textarea { resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; line-height: 1.5; }
.field-group--wide, .special-fields { grid-column: 1 / -1; }
.special-fields { display: grid; grid-template-columns: minmax(220px, .45fr) 1fr; gap: 18px; }
.segmented { display: inline-flex; width: fit-content; padding: 3px; border: 1px solid var(--border-color-light); border-radius: 9px; background: var(--card-bg); }
.segmented label { cursor: pointer; }
.segmented input { position: absolute; opacity: 0; pointer-events: none; }
.segmented span { display: block; min-width: 74px; padding: 7px 15px; border-radius: 6px; text-align: center; font-weight: 650; }
.segmented input:checked + span { color: #fffaf5; background: #3b3733; }
.segmented input:focus-visible + span { outline: 2px solid var(--accent-color); outline-offset: 2px; }
.field-error { margin: 0; color: #9a3f31; font-size: 13px; }
@media (max-width: 720px) {
  .judge-fields, .special-fields { grid-template-columns: 1fr; }
  .judge-fields header { align-items: start; flex-direction: column; gap: 8px; }
  .judge-fields header > p { text-align: left; }
}
</style>
