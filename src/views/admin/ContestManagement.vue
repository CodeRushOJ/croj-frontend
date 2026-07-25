<template>
  <section class="contest-management">
    <header class="page-heading">
      <div>
        <span class="eyebrow">Contest operations</span>
        <h2>比赛工作台</h2>
        <p>创建草稿，按 ID 打开服务器记录，编排不可变题目版本，再发布或取消。</p>
      </div>
      <div v-if="contestId" class="current-contest">
        <span>#<b data-testid="contest-current-id">{{ contestId }}</b></span>
        <strong data-testid="contest-lifecycle">{{ lifecycle }}</strong>
      </div>
    </header>

    <aside class="capability-note" data-testid="contest-capability-note">
      当前后端暂不提供比赛列表、显式题目顺序、ETag 或开放/关闭/归档接口。此页只呈现真实可用的创建、按 ID 打开、编辑、排题、发布与取消能力。
    </aside>

    <div class="open-bar">
      <label>
        比赛 ID
        <input v-model="contestIdInput" :disabled="busy" data-testid="contest-open-id" inputmode="numeric">
      </label>
      <button type="button" :disabled="busy" data-testid="contest-open" @click="openContest()">
        打开比赛
      </button>
      <button type="button" :disabled="busy" data-testid="contest-new" @click="resetWorkspace">
        新建空白草稿
      </button>
    </div>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <div v-if="errorMessage" class="error" role="alert">
      <span>{{ errorMessage }}</span>
      <button v-if="conflict" type="button" @click="openContest(contestId)">重新加载服务器版本</button>
    </div>

    <form aria-label="比赛设置" class="editor-card" @submit.prevent="saveContest">
      <div class="section-heading">
        <div>
          <span class="step">01</span>
          <h3>比赛设置</h3>
        </div>
        <span>{{ contestId ? `服务器比赛 #${contestId}` : "尚未创建" }}</span>
      </div>

      <fieldset class="form-grid" :disabled="busy || (contestId && lifecycle !== 'DRAFT')">
        <label class="span-2">
          比赛标题
          <input v-model="draft.title" maxlength="255" required data-testid="contest-title">
        </label>
        <label>
          赛制
          <select v-model="draft.ruleType" data-testid="contest-rule">
            <option value="ACM">ACM</option>
            <option value="OI">OI</option>
          </select>
        </label>
        <label>
          可见性
          <select v-model="draft.visibility" data-testid="contest-visibility">
            <option value="PUBLIC">公开</option>
            <option value="PRIVATE">私有</option>
          </select>
        </label>
        <label class="span-2">
          比赛说明
          <textarea v-model="draft.descriptionMarkdown" rows="5" data-testid="contest-description" />
        </label>
        <label>
          开放报名
          <input v-model="draft.registrationOpensAt" type="datetime-local" step="0.001" required>
        </label>
        <label>
          关闭报名
          <input v-model="draft.registrationClosesAt" type="datetime-local" step="0.001" required>
        </label>
        <label>
          比赛开始
          <input v-model="draft.startsAt" type="datetime-local" step="0.001" required>
        </label>
        <label>
          封榜时间
          <input v-model="draft.freezeAt" type="datetime-local" step="0.001">
        </label>
        <label>
          比赛结束
          <input v-model="draft.endsAt" type="datetime-local" step="0.001" required>
        </label>
      </fieldset>

      <footer class="card-actions">
        <button
          v-if="!contestId"
          type="submit"
          :disabled="busy"
          data-testid="contest-save"
        >
          创建比赛草稿
        </button>
        <button
          v-else
          type="submit"
          :disabled="busy || lifecycle !== 'DRAFT'"
          data-testid="contest-save"
        >
          保存比赛设置
        </button>
      </footer>
    </form>

    <section v-if="contestId" class="editor-card" aria-labelledby="problem-arrangement-title">
      <div class="section-heading">
        <div>
          <span class="step">02</span>
          <h3 id="problem-arrangement-title">题目编排</h3>
        </div>
        <span>后端按标签排序 · {{ problems.length }} 题</span>
      </div>

      <fieldset v-if="lifecycle === 'DRAFT'" class="problem-finder" :disabled="busy">
        <label>
          待添加题目 ID
          <input v-model="problemLookupId" inputmode="numeric" data-testid="contest-problem-id">
        </label>
        <button type="button" :disabled="busy" data-testid="contest-version-search" @click="discoverVersions">
          查询已发布版本
        </button>
        <label>
          不可变题目版本
          <select v-model="selectedVersionId" data-testid="contest-version-select">
            <option value="">请选择</option>
            <option
              v-for="version in publishedVersions"
              :key="version.versionId"
              :value="String(version.versionId)"
            >
              版本 {{ version.versionNo }} · PUBLISHED
            </option>
          </select>
        </label>
        <label>
          题目标签
          <input v-model="problemLabel" maxlength="16" data-testid="contest-problem-label">
        </label>
        <label>
          题目分值
          <input v-model="problemScore" type="number" min="1" max="10000" data-testid="contest-problem-score">
        </label>
        <button type="button" :disabled="busy || !selectedVersionId" data-testid="contest-add-problem" @click="addProblem">
          加入比赛
        </button>
      </fieldset>

      <div class="problem-list">
        <article
          v-for="problem in problems"
          :key="problem.problemId"
          class="problem-row"
          :data-testid="`contest-problem-row-${problem.problemId}`"
        >
          <b>{{ problem.label }}</b>
          <div>
            <strong>{{ problem.title || `题目 #${problem.problemId}` }}</strong>
            <small>#{{ problem.problemId }} · 不可变版本 {{ problem.problemVersionId }}</small>
            <div v-if="lifecycle === 'DRAFT'" class="problem-row-editor">
              <label>
                标签
                <input
                  v-model="problem.label"
                  :aria-label="`题目 ${problem.label} 标签`"
                  :disabled="busy"
                  maxlength="16"
                >
              </label>
              <label>
                分值
                <input
                  v-model="problem.score"
                  :aria-label="`题目 ${problem.label} 分值`"
                  :disabled="busy"
                  type="number"
                  min="1"
                  max="10000"
                >
              </label>
            </div>
          </div>
          <span>{{ problem.score }} 分</span>
          <button
            v-if="lifecycle === 'DRAFT'"
            type="button"
            :aria-label="`移除题目 ${problem.label}`"
            :disabled="busy"
            @click="removeProblem(problem.problemId)"
          >
            移除
          </button>
        </article>
        <p v-if="!problems.length" class="empty">尚未编排题目。发布前至少需要一题。</p>
      </div>

      <footer v-if="lifecycle === 'DRAFT'" class="card-actions">
        <button type="button" :disabled="busy || !problems.length" data-testid="contest-save-roster" @click="saveProblems">
          保存题目编排
        </button>
      </footer>
    </section>

    <section v-if="contestId" class="lifecycle-card">
      <div>
        <span class="step">03</span>
        <h3>生命周期</h3>
        <p>发布后比赛设置与题目编排不可修改；取消操作同样写入服务器。</p>
        <p v-if="settingsDirty || problemsDirty" class="unsaved-note" role="status">
          先保存当前设置与题目编排，才能发布服务器中的同一版本。
        </p>
      </div>
      <div class="lifecycle-actions">
        <button
          v-if="lifecycle === 'DRAFT'"
          type="button"
          :disabled="busy || !problems.length || settingsDirty || problemsDirty"
          data-testid="contest-publish"
          @click="publishContest"
        >
          发布比赛
        </button>
        <button
          v-if="lifecycle !== 'CANCELLED'"
          type="button"
          class="danger"
          :disabled="busy"
          data-testid="contest-cancel"
          @click="cancelContest"
        >
          取消比赛
        </button>
      </div>
    </section>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { adminContestApi, contestApi } from "@/api/contest";
import { problemApi } from "@/api/problem";
import { adminTestBundleApi } from "@/api/testBundle";
import {
  normalizeProblemArrangement,
  toLocalDateTimeInput,
  toContestPayload,
  validateContestDraft,
} from "./contestWorkflow";

const emptyDraft = () => ({
  title: "",
  descriptionMarkdown: "",
  ruleType: "ACM",
  visibility: "PUBLIC",
  registrationOpensAt: "",
  registrationClosesAt: "",
  startsAt: "",
  freezeAt: "",
  endsAt: "",
});

const draft = reactive(emptyDraft());
const contestIdInput = ref("");
const contestId = ref(null);
const lifecycle = ref("");
const problems = ref([]);
const busy = ref(false);
const notice = ref("");
const errorMessage = ref("");
const conflict = ref(false);
const problemLookupId = ref("");
const problemLookup = ref(null);
const publishedVersions = ref([]);
const selectedVersionId = ref("");
const problemLabel = ref("A");
const problemScore = ref("100");
const settingsDirty = ref(false);
const problemsDirty = ref(false);
let loadSequence = 0;
let loadController = null;
let syncingDraft = false;
let syncingProblems = false;

watch(problemLookupId, () => {
  problemLookup.value = null;
  publishedVersions.value = [];
  selectedVersionId.value = "";
});

watch(draft, () => {
  if (!syncingDraft) settingsDirty.value = true;
}, { deep: true, flush: "sync" });

watch(problems, () => {
  if (!syncingProblems) problemsDirty.value = true;
}, { deep: true, flush: "sync" });

const replaceDraft = (value) => {
  syncingDraft = true;
  Object.assign(draft, value);
  syncingDraft = false;
  settingsDirty.value = false;
};

const replaceProblems = (value) => {
  syncingProblems = true;
  problems.value = value;
  syncingProblems = false;
  problemsDirty.value = false;
};

const clearMessages = () => {
  notice.value = "";
  errorMessage.value = "";
  conflict.value = false;
};

const applyContest = (serverContest) => {
  contestId.value = Number(serverContest.id);
  contestIdInput.value = String(serverContest.id);
  lifecycle.value = serverContest.lifecycle || "DRAFT";
  replaceDraft({
    title: serverContest.title || "",
    descriptionMarkdown: serverContest.descriptionMarkdown || "",
    ruleType: serverContest.ruleType || "ACM",
    visibility: serverContest.visibility || "PUBLIC",
    registrationOpensAt: toLocalDateTimeInput(serverContest.registrationOpensAt),
    registrationClosesAt: toLocalDateTimeInput(serverContest.registrationClosesAt),
    startsAt: toLocalDateTimeInput(serverContest.startsAt),
    freezeAt: toLocalDateTimeInput(serverContest.freezeAt),
    endsAt: toLocalDateTimeInput(serverContest.endsAt),
  });
};

const confirmDiscardWorkspace = () => (
  (!settingsDirty.value && !problemsDirty.value)
  || window.confirm("当前工作区有未保存内容，确定放弃并切换吗？")
);

const resetWorkspace = () => {
  if (!confirmDiscardWorkspace()) return;
  loadSequence += 1;
  loadController?.abort();
  contestId.value = null;
  contestIdInput.value = "";
  lifecycle.value = "";
  replaceProblems([]);
  problemLookupId.value = "";
  problemLookup.value = null;
  publishedVersions.value = [];
  selectedVersionId.value = "";
  problemLabel.value = "A";
  problemScore.value = "100";
  replaceDraft(emptyDraft());
  clearMessages();
};

const mapError = (error, fallback) => {
  if (error?.response?.status === 409) {
    conflict.value = true;
    return "比赛状态已经变化；当前编辑内容仍保留，请决定是否重新加载服务器版本。";
  }
  if (error?.response?.status === 403) return "没有比赛管理权限。";
  if (error?.response?.status === 404) return "服务器中没有这场比赛。";
  if (error?.response?.status === 422) return "服务器拒绝了当前比赛设置，请检查时间与题目版本。";
  return fallback;
};

const openContest = async (target = contestIdInput.value) => {
  const id = Number(target);
  if (!Number.isInteger(id) || id <= 0) {
    clearMessages();
    errorMessage.value = "请输入有效的比赛 ID。";
    return;
  }
  if (id !== contestId.value && !confirmDiscardWorkspace()) return;
  clearMessages();

  const sequence = ++loadSequence;
  loadController?.abort();
  loadController = new AbortController();
  busy.value = true;
  try {
    const [detail, arrangement] = await Promise.all([
      contestApi.detail(id, { signal: loadController.signal }),
      contestApi.problems(id, { signal: loadController.signal }),
    ]);
    if (sequence !== loadSequence) return;
    const serverContest = detail.data?.contest
      ? { ...detail.data.contest, phase: detail.data.phase }
      : detail.data;
    applyContest(serverContest);
    replaceProblems(Array.isArray(arrangement.data) ? arrangement.data : []);
    notice.value = `已打开服务器比赛 #${id}。`;
  } catch (error) {
    if (sequence !== loadSequence || error?.code === "ERR_CANCELED") return;
    errorMessage.value = mapError(error, "比赛加载失败，请稍后重试。");
  } finally {
    if (sequence === loadSequence) busy.value = false;
  }
};

const saveContest = async () => {
  clearMessages();
  const validation = validateContestDraft(draft);
  if (validation) {
    errorMessage.value = validation;
    return;
  }
  busy.value = true;
  try {
    const payload = toContestPayload(draft);
    if (contestId.value) {
      await adminContestApi.update(contestId.value, payload);
      settingsDirty.value = false;
      notice.value = "比赛设置已保存到服务器。";
    } else {
      const response = await adminContestApi.create(payload);
      contestId.value = Number(response.data);
      contestIdInput.value = String(response.data);
      lifecycle.value = "DRAFT";
      settingsDirty.value = false;
      notice.value = `服务器草稿 #${response.data} 已创建。`;
    }
  } catch (error) {
    errorMessage.value = mapError(error, "比赛设置保存失败，请稍后重试。");
  } finally {
    busy.value = false;
  }
};

const discoverVersions = async () => {
  clearMessages();
  problemLookup.value = null;
  publishedVersions.value = [];
  selectedVersionId.value = "";
  const id = Number(problemLookupId.value);
  if (!Number.isInteger(id) || id <= 0) {
    errorMessage.value = "请输入有效的题目 ID。";
    return;
  }
  busy.value = true;
  try {
    const [problem, versions] = await Promise.all([
      problemApi.getProblemById(id),
      adminTestBundleApi.listVersions(id),
    ]);
    problemLookup.value = problem.data;
    publishedVersions.value = (versions.data || []).filter(({ state }) => state === "PUBLISHED");
    if (!publishedVersions.value.length) {
      errorMessage.value = "该题目没有可用于比赛的已发布不可变版本。";
    }
  } catch (error) {
    errorMessage.value = mapError(error, "题目版本查询失败，请稍后重试。");
  } finally {
    busy.value = false;
  }
};

const addProblem = () => {
  clearMessages();
  try {
    const [normalized] = normalizeProblemArrangement([{
      problemId: problemLookup.value?.id || problemLookupId.value,
      problemVersionId: selectedVersionId.value,
      label: problemLabel.value,
      score: problemScore.value,
    }]);
    normalizeProblemArrangement([...problems.value, normalized]);
    problems.value.push({ ...normalized, title: problemLookup.value?.title });
    problems.value.sort((left, right) => left.label.localeCompare(right.label));
    problemLabel.value = String.fromCharCode(65 + Math.min(problems.value.length, 25));
    selectedVersionId.value = "";
    notice.value = "题目已加入当前编辑区；请保存编排以写入服务器。";
  } catch (error) {
    errorMessage.value = error.message;
  }
};

const removeProblem = (problemId) => {
  if (busy.value) return;
  problems.value = problems.value.filter((problem) => problem.problemId !== problemId);
};

const saveProblems = async () => {
  clearMessages();
  busy.value = true;
  try {
    const arrangement = normalizeProblemArrangement(problems.value);
    await adminContestApi.arrangeProblems(contestId.value, arrangement);
    const previous = new Map(problems.value.map((problem) => [problem.problemId, problem]));
    replaceProblems(arrangement
      .map((problem) => ({ ...problem, title: previous.get(problem.problemId)?.title }))
      .sort((left, right) => left.label.localeCompare(right.label)));
    notice.value = "题目编排已保存到服务器。";
  } catch (error) {
    errorMessage.value = mapError(error, error.message || "题目编排保存失败。");
  } finally {
    busy.value = false;
  }
};

const publishContest = async () => {
  if (!window.confirm("发布后比赛设置与题目版本不可修改，确定发布吗？")) return;
  clearMessages();
  busy.value = true;
  try {
    await adminContestApi.publish(contestId.value);
    lifecycle.value = "PUBLISHED";
    notice.value = "比赛已发布。";
  } catch (error) {
    errorMessage.value = mapError(error, "比赛发布失败，请稍后重试。");
  } finally {
    busy.value = false;
  }
};

const cancelContest = async () => {
  if (!window.confirm("确定取消这场比赛吗？")) return;
  clearMessages();
  busy.value = true;
  try {
    await adminContestApi.cancel(contestId.value);
    lifecycle.value = "CANCELLED";
    notice.value = "比赛已取消。";
  } catch (error) {
    errorMessage.value = mapError(error, "比赛取消失败，请稍后重试。");
  } finally {
    busy.value = false;
  }
};
</script>

<style scoped>
.contest-management { display: grid; gap: 18px; max-width: 1080px; margin: 0 auto; color: var(--text-color); }
.page-heading { display: flex; justify-content: space-between; gap: 24px; align-items: end; padding: 4px 2px; }
.page-heading h2 { margin: 5px 0 7px; font-size: 30px; letter-spacing: -.035em; }
.page-heading p, .section-heading > span, .lifecycle-card p { margin: 0; color: var(--text-color-secondary); font-size: 13px; }
.eyebrow, .step { color: var(--accent-color); font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.current-contest { display: grid; gap: 5px; text-align: right; font-variant-numeric: tabular-nums; }
.current-contest span { color: var(--text-color-secondary); font-size: 12px; }
.current-contest strong { color: #087d5c; font-size: 13px; }
.capability-note { padding: 13px 16px; border: 1px solid #e9dfd2; border-radius: 12px; background: #fffaf3; color: #745f46; font-size: 12px; line-height: 1.6; }
.open-bar { display: flex; align-items: end; gap: 10px; padding: 15px 18px; border: 1px solid var(--border-color-light); border-radius: 14px; background: var(--card-bg); }
.open-bar label { flex: 1; max-width: 250px; }
label { display: grid; gap: 6px; color: var(--text-color-secondary); font-size: 12px; font-weight: 700; }
input, select, textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 9px; padding: 10px 11px; background: var(--bg-color); color: var(--text-color); font: inherit; }
textarea { resize: vertical; line-height: 1.6; }
button { border: 1px solid var(--border-color); border-radius: 9px; padding: 9px 13px; background: var(--card-bg); color: var(--text-color); font-weight: 750; cursor: pointer; }
button:hover:not(:disabled) { border-color: var(--accent-color); color: var(--accent-color); }
button:disabled { cursor: not-allowed; opacity: .48; }
.editor-card, .lifecycle-card { border: 1px solid var(--border-color-light); border-radius: 18px; padding: 21px; background: var(--card-bg); box-shadow: 0 10px 28px rgba(61,49,39,.045); }
.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 15px; margin-bottom: 18px; }
.section-heading > div { display: flex; align-items: center; gap: 11px; }
.section-heading h3, .lifecycle-card h3 { margin: 0; font-size: 20px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.form-grid, .problem-finder { min-width: 0; margin: 0; padding: 0; border: 0; }
.span-2 { grid-column: span 2; }
.card-actions { display: flex; justify-content: flex-end; margin-top: 17px; }
.card-actions button, .lifecycle-actions button:first-child { border-color: #3b3733; background: #3b3733; color: white; }
.notice, .error { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 0; padding: 11px 15px; border-radius: 11px; font-size: 13px; }
.notice { background: #edf8f3; color: #087d5c; }
.error { background: #fff0ee; color: #a53e35; }
.problem-finder { display: grid; grid-template-columns: 1fr auto 1.3fr .8fr .8fr auto; gap: 10px; align-items: end; padding: 14px; border-radius: 12px; background: var(--bg-color); }
.problem-list { margin-top: 14px; }
.problem-row { display: grid; grid-template-columns: 40px minmax(0,1fr) 80px auto; gap: 12px; align-items: center; min-height: 64px; border-top: 1px solid var(--border-color-light); }
.problem-row > b { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9px; background: var(--accent-color-soft); color: var(--accent-color); }
.problem-row > div { display: grid; gap: 3px; }
.problem-row-editor { display: grid; grid-template-columns: 86px 110px; gap: 7px; margin-top: 6px; }
.problem-row-editor label { gap: 3px; font-size: 10px; }
.problem-row-editor input { padding: 6px 8px; font-size: 11px; }
.problem-row small, .problem-row > span, .empty { color: var(--text-color-secondary); font-size: 11px; }
.empty { text-align: center; padding: 18px; }
.lifecycle-card { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.lifecycle-card > div:first-child { display: grid; gap: 7px; }
.lifecycle-actions { display: flex; gap: 9px; }
.danger { border-color: #cf6d63; color: #a53e35; }
@media (max-width: 850px) {
  .problem-finder { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: auto; }
}
@media (max-width: 620px) {
  .page-heading, .lifecycle-card { align-items: stretch; flex-direction: column; }
  .current-contest { text-align: left; }
  .open-bar { align-items: stretch; flex-direction: column; }
  .open-bar label { max-width: none; }
  .problem-finder { grid-template-columns: 1fr; }
}
</style>
