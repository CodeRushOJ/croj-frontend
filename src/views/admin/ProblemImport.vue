<template>
  <section class="import-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">Problem library</p>
        <h2>题目导入</h2>
        <p>上传题目包后先在服务端解析与校验，确认无误才会写入题库。</p>
      </div>
      <a
        class="format-link"
        href="https://github.com/zhblue/freeproblemset/tree/master"
        target="_blank"
        rel="noreferrer"
      >查看 FreeProblemSet 格式</a>
    </header>

    <div class="upload-panel">
      <label class="file-field" for="problem-package">
        <span class="file-field__title">选择题目包</span>
        <span class="file-field__hint">支持 FreeProblemSet XML 与 ZIP 归档，格式、大小和归档安全由服务端强制校验。</span>
        <input
          id="problem-package"
          ref="fileInput"
          type="file"
          aria-label="选择题目包"
          accept=".xml,.zip,application/xml,text/xml,application/zip"
          :disabled="preflighting || committing"
          @change="handleFileChange"
        >
      </label>

      <div v-if="selectedFile" class="selected-file">
        <div>
          <strong>{{ selectedFile.name }}</strong>
          <span>{{ formatBytes(selectedFile.size) }}</span>
        </div>
        <button
          type="button"
          class="secondary-button"
          :disabled="preflighting || committing"
          @click="clearSelection"
        >重新选择</button>
      </div>

      <div v-if="preflighting" class="progress-state" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <span>正在上传并预检题目包…</span>
        <button type="button" class="secondary-button" @click="cancelPreflight">取消上传</button>
      </div>

      <div v-if="requestError" class="request-error" role="alert">
        <div>
          <strong>题目包预检失败</strong>
          <p>{{ requestError }}</p>
        </div>
        <button type="button" class="secondary-button" @click="preflightSelectedFile">重试预检</button>
      </div>
    </div>

    <template v-if="preflight">
      <section class="summary-panel" aria-label="预检摘要">
        <div class="summary-item">
          <span>检测格式</span>
          <strong>{{ preflight.detectedFormat || "UNKNOWN" }}</strong>
        </div>
        <div class="summary-item">
          <span>题目</span>
          <strong>{{ preflight.problemCount }} 道题目</strong>
        </div>
        <div class="summary-item">
          <span>测试数据</span>
          <strong>{{ preflight.testCaseCount }} 个测试用例</strong>
        </div>
        <div class="summary-item summary-item--sha">
          <span>文件 SHA-256</span>
          <code>{{ preflight.sha256 || "—" }}</code>
        </div>
      </section>

      <section v-if="errors.length" class="message-panel message-panel--error" aria-label="预检错误">
        <h3>{{ errors.length }} 个错误需要修复</h3>
        <ul>
          <li v-for="message in errors" :key="message">{{ message }}</li>
        </ul>
      </section>

      <section v-if="warnings.length" class="message-panel message-panel--warning" aria-label="预检警告">
        <h3>{{ warnings.length }} 个警告</h3>
        <ul>
          <li v-for="message in warnings" :key="message">{{ message }}</li>
        </ul>
      </section>

      <section class="preview-panel">
        <div class="section-heading">
          <div>
            <h3>逐题预检</h3>
            <p>确认题面与测试用例数量符合预期。</p>
          </div>
        </div>

        <div class="table-scroll">
          <table aria-label="题目预检结果">
            <thead>
              <tr>
                <th>来源 ID</th>
                <th>题目</th>
                <th>测试用例</th>
                <th>状态</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(problem, index) in problems" :key="problem.sourceId || index">
                <td><code>{{ problem.sourceId || "—" }}</code></td>
                <td><strong>{{ problem.title || "未命名题目" }}</strong></td>
                <td>{{ problem.testCaseCount ?? 0 }}</td>
                <td>
                  <span class="status" :class="statusClass(problem)">{{ statusLabel(problem) }}</span>
                </td>
                <td class="problem-notes">{{ problemNotes(problem) }}</td>
              </tr>
              <tr v-if="!problems.length">
                <td colspan="5" class="empty-row">题目包中没有可预览的题目。</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="commit-bar">
        <div>
          <strong>{{ canCommit ? "预检已通过" : "导入已阻止" }}</strong>
          <p>{{ canCommit ? "确认后会创建题目及其不可变测试数据版本。" : "请修复全部错误后重新上传题目包。" }}</p>
          <p v-if="commitError" class="commit-error" role="alert">确认导入失败：{{ commitError }}</p>
          <p v-if="successMessage" class="success-message" aria-live="polite">{{ successMessage }}</p>
        </div>
        <button
          type="button"
          class="primary-button"
          :disabled="!canCommit || committing || Boolean(successMessage)"
          @click="commitImport"
        >
          {{ commitButtonLabel }}
        </button>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onUnmounted, ref } from "vue";
import { problemImportApi } from "@/api/problemImport";

const fileInput = ref(null);
const selectedFile = ref(null);
const preflight = ref(null);
const preflighting = ref(false);
const committing = ref(false);
const requestError = ref("");
const commitError = ref("");
const successMessage = ref("");
let preflightController = null;
let commitController = null;

const errors = computed(() => preflight.value?.errors || []);
const warnings = computed(() => preflight.value?.warnings || []);
const problems = computed(() => preflight.value?.problems || []);
const hasProblemErrors = computed(() => problems.value.some((problem) => (problem.errors || []).length > 0));
const canCommit = computed(() => Boolean(
  preflight.value?.jobId
    && !errors.value.length
    && !hasProblemErrors.value
    && Number(preflight.value.problemCount) > 0,
));

const commitButtonLabel = computed(() => {
  if (committing.value) return "正在导入…";
  if (!canCommit.value) return "修复错误后才能导入";
  if (commitError.value) return `重试导入 ${preflight.value.problemCount} 道题目`;
  return `确认导入 ${preflight.value.problemCount} 道题目`;
});

const errorMessage = (error) => error?.response?.data?.message || error?.message || "请稍后重试";

const resetResult = () => {
  preflight.value = null;
  requestError.value = "";
  commitError.value = "";
  successMessage.value = "";
};

const handleFileChange = async (event) => {
  const file = event.target.files?.[0];
  resetResult();
  selectedFile.value = file || null;
  if (!file) return;

  if (!/\.(xml|zip)$/i.test(file.name)) {
    requestError.value = "仅支持 .xml 或 .zip 题目包。";
    return;
  }

  await preflightSelectedFile();
};

const preflightSelectedFile = async () => {
  if (!selectedFile.value || preflighting.value) return;
  preflighting.value = true;
  requestError.value = "";
  commitError.value = "";
  successMessage.value = "";
  preflight.value = null;
  preflightController?.abort();
  const controller = new AbortController();
  preflightController = controller;

  try {
    const response = await problemImportApi.preflight(selectedFile.value, { signal: controller.signal });
    preflight.value = response.data;
  } catch (error) {
    if (error?.code !== "ERR_CANCELED" && error?.name !== "AbortError") {
      requestError.value = errorMessage(error);
    }
  } finally {
    if (preflightController === controller) {
      preflightController = null;
      preflighting.value = false;
    }
  }
};

const cancelPreflight = () => {
  preflightController?.abort();
};

const commitImport = async () => {
  if (!canCommit.value || committing.value) return;
  committing.value = true;
  commitError.value = "";
  commitController?.abort();
  const controller = new AbortController();
  commitController = controller;

  try {
    const response = await problemImportApi.commit(preflight.value.jobId, { signal: controller.signal });
    const importedCount = response.data?.importedCount ?? preflight.value.problemCount;
    successMessage.value = `已成功导入 ${importedCount} 道题目`;
  } catch (error) {
    if (error?.code !== "ERR_CANCELED" && error?.name !== "AbortError") {
      commitError.value = errorMessage(error);
    }
  } finally {
    if (commitController === controller) {
      commitController = null;
      committing.value = false;
    }
  }
};

const clearSelection = () => {
  preflightController?.abort();
  selectedFile.value = null;
  resetResult();
  if (fileInput.value) fileInput.value.value = "";
};

onUnmounted(() => {
  preflightController?.abort();
  commitController?.abort();
});

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusLabel = (problem) => {
  if ((problem.errors || []).length) return "错误";
  if ((problem.warnings || []).length || problem.status === "WARNING") return "警告";
  return "可导入";
};

const statusClass = (problem) => ({
  "status--error": (problem.errors || []).length > 0,
  "status--warning": !(problem.errors || []).length && ((problem.warnings || []).length > 0 || problem.status === "WARNING"),
  "status--ready": !(problem.errors || []).length && !(problem.warnings || []).length && problem.status !== "WARNING",
});

const problemNotes = (problem) => [...(problem.errors || []), ...(problem.warnings || [])].join("；") || "—";
</script>

<style scoped>
.import-page {
  --paper: #fffdf9;
  --ink: #2f2b27;
  --muted: #746d65;
  --line: #e7e0d7;
  --soft: #f7f2eb;
  color: var(--ink);
  display: grid;
  gap: 18px;
}

.page-heading,
.section-heading,
.selected-file,
.commit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.page-heading h2,
.section-heading h3,
.message-panel h3 { margin: 0; }
.page-heading h2 { font: 600 30px/1.2 Georgia, "Noto Serif SC", serif; letter-spacing: -.02em; }
.page-heading p,
.section-heading p,
.commit-bar p { color: var(--muted); margin: 7px 0 0; }
.eyebrow { color: #9b5c3d !important; font-size: 11px; font-weight: 750; letter-spacing: .14em; margin: 0 0 8px !important; text-transform: uppercase; }
.format-link { color: #8a4f34; font-weight: 650; white-space: nowrap; }

.upload-panel,
.summary-panel,
.preview-panel,
.message-panel,
.commit-bar {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.upload-panel { padding: 18px; }
.file-field { border: 1px dashed #cfc3b6; border-radius: 10px; cursor: pointer; display: grid; gap: 5px; padding: 28px; text-align: center; transition: border-color .15s, background .15s; }
.file-field:hover { background: #fcf8f2; border-color: #9b765f; }
.file-field__title { font-size: 16px; font-weight: 700; }
.file-field__hint { color: var(--muted); font-size: 13px; }
.file-field input { margin: 10px auto 0; max-width: 100%; }
.selected-file { border-top: 1px solid var(--line); margin-top: 16px; padding-top: 16px; }
.selected-file div { display: grid; gap: 3px; }
.selected-file span { color: var(--muted); font-size: 12px; }

.progress-state,
.request-error { align-items: center; display: flex; gap: 10px; margin-top: 16px; }
.progress-state .secondary-button { margin-left: auto; }
.request-error { background: #fff4f1; border-radius: 9px; color: #8d3429; justify-content: space-between; padding: 12px 14px; }
.request-error p { margin: 3px 0 0; }
.spinner { animation: spin .8s linear infinite; border: 2px solid var(--line); border-top-color: #8a4f34; border-radius: 50%; height: 16px; width: 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.summary-panel { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)) minmax(260px, 2fr); overflow: hidden; }
.summary-item { display: grid; gap: 7px; padding: 16px 18px; }
.summary-item + .summary-item { border-left: 1px solid var(--line); }
.summary-item span { color: var(--muted); font-size: 12px; }
.summary-item code { font-size: 12px; overflow-wrap: anywhere; }

.message-panel { padding: 16px 18px; }
.message-panel h3 { font-size: 14px; }
.message-panel ul { margin: 10px 0 0; padding-left: 20px; }
.message-panel--error { background: #fff7f4; border-color: #ebc8bd; color: #8d3429; }
.message-panel--warning { background: #fffbef; border-color: #e8dab1; color: #765b18; }

.preview-panel { overflow: hidden; }
.section-heading { padding: 18px; }
.section-heading h3 { font-size: 17px; }
.section-heading p { font-size: 13px; }
.table-scroll { overflow-x: auto; }
table { border-collapse: collapse; min-width: 760px; width: 100%; }
th, td { border-top: 1px solid var(--line); padding: 12px 16px; text-align: left; vertical-align: top; }
th { background: var(--soft); color: var(--muted); font-size: 11px; letter-spacing: .04em; text-transform: uppercase; }
td { font-size: 13px; }
.problem-notes { color: var(--muted); max-width: 320px; }
.empty-row { color: var(--muted); padding: 30px; text-align: center; }
.status { border-radius: 999px; display: inline-flex; font-size: 11px; font-weight: 700; padding: 4px 8px; white-space: nowrap; }
.status--ready { background: #eef5ed; color: #476246; }
.status--warning { background: #f7efd5; color: #765b18; }
.status--error { background: #f8ded8; color: #8d3429; }

.commit-bar { padding: 16px 18px; position: sticky; bottom: 12px; box-shadow: 0 10px 30px rgba(61, 49, 39, .08); }
.commit-bar p { font-size: 12px; }
.commit-error { color: #8d3429 !important; }
.success-message { color: #476246 !important; font-weight: 700; }
.primary-button,
.secondary-button { border-radius: 8px; cursor: pointer; font: inherit; font-weight: 700; padding: 9px 14px; }
.primary-button { background: #3c3732; border: 1px solid #3c3732; color: #fffaf5; }
.secondary-button { background: transparent; border: 1px solid #cfc3b6; color: var(--ink); }
button:disabled { cursor: not-allowed; opacity: .48; }

@media (max-width: 840px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .summary-panel { grid-template-columns: repeat(2, 1fr); }
  .summary-item + .summary-item { border-left: 0; }
  .summary-item:nth-child(even) { border-left: 1px solid var(--line); }
  .summary-item:nth-child(n + 3) { border-top: 1px solid var(--line); }
  .summary-item--sha { grid-column: 1 / -1; }
  .commit-bar { align-items: stretch; flex-direction: column; }
  .primary-button { width: 100%; }
}
</style>
