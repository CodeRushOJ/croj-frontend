<template>
  <section class="bundle-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">IMMUTABLE JUDGE DATA</p>
        <h2>测试包管理</h2>
        <p>为一个草稿题目版本上传并发布经过服务端校验的 TestBundle v1 ZIP。</p>
      </div>
    </header>

    <form class="lookup-panel" @submit.prevent="loadVersions">
      <label>
        <span>题目 ID</span>
        <input
          v-model="problemId"
          aria-label="题目 ID"
          inputmode="numeric"
          required
          @input="handleProblemTargetChange"
        />
      </label>
      <label>
        <span>草稿版本</span>
        <select
          v-model="versionId"
          aria-label="草稿版本"
          :disabled="busy || !draftVersions.length"
          @change="handleVersionTargetChange"
        >
          <option value="">{{ draftVersions.length ? "请选择草稿版本" : "暂无草稿版本" }}</option>
          <option
            v-for="version in draftVersions"
            :key="version.versionId"
            :value="version.versionId"
          >版本 {{ version.versionNo }} · DRAFT</option>
        </select>
      </label>
      <button class="primary-button" type="submit" :disabled="busy">加载版本</button>
    </form>

    <div v-if="errorMessage" class="state-panel state-panel--error" role="alert">
      <div>
        <strong>{{ errorTitle }}</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <button v-if="stale" type="button" :disabled="busy" @click="refreshMetadata">刷新服务器版本</button>
    </div>
    <p v-if="notice" class="notice" aria-live="polite">{{ notice }}</p>

    <section v-if="metadata" class="metadata-panel" aria-label="测试包服务器状态">
      <div><span>版本状态</span><strong>{{ metadata.state }}</strong></div>
      <div><span>测试包</span><strong>{{ metadata.attached ? "已附加" : "未附加" }}</strong></div>
      <div><span>SHA-256</span><code>{{ metadata.sha256 || "—" }}</code></div>
      <div><span>强 ETag</span><code>{{ etag || "—" }}</code></div>
    </section>

    <section v-if="metadata" class="action-panel">
      <label class="file-field">
        <span>TestBundle ZIP</span>
        <input
          ref="fileInput"
          aria-label="TestBundle ZIP"
          type="file"
          accept=".zip,application/zip"
          :disabled="busy || metadata.state !== 'DRAFT'"
          @change="selectFile"
        />
      </label>
      <p v-if="selectedFile" class="selected-file">{{ selectedFile.name }} · {{ formatBytes(selectedFile.size) }}</p>
      <div class="actions">
        <button
          v-if="uploading"
          type="button"
          class="secondary-button"
          @click="cancelUpload"
        >取消上传</button>
        <button
          v-else
          type="button"
          class="primary-button"
          :disabled="!selectedFile || publishing || metadata.state !== 'DRAFT'"
          @click="uploadBundle"
        >上传并校验测试包</button>
        <button
          type="button"
          class="publish-button"
          :disabled="busy || !metadata.attached || metadata.state !== 'DRAFT' || !etag"
          @click="publishBundle"
        >发布题目版本</button>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { adminTestBundleApi } from "@/api/testBundle";

const STATUS_MESSAGES = {
  400: ["请求格式不正确", "请检查题目 ID、版本 ID、ETag 与上传文件。"],
  403: ["没有测试包管理权限", "请使用管理员账号，或联系超级管理员检查角色。"],
  404: ["题目或草稿版本不存在", "请确认题目 ID 与版本 ID 后重新加载。"],
  409: ["当前题目版本状态不允许此操作", "只有草稿版本可以接收和发布测试包。"],
  412: ["服务器版本已经变化", "其他管理员修改了该版本；文件和输入仍保留，请显式刷新。"],
  413: ["测试包超过服务端大小限制", "请缩小 ZIP，服务端不会接受超限归档。"],
  422: ["测试包未通过安全或格式校验", "请修复 manifest、文件清单或归档安全问题后重试。"],
  428: ["缺少服务器版本前置条件", "请刷新服务器状态以取得最新强 ETag。"],
};

const problemId = ref("");
const versionId = ref("");
const versions = ref([]);
const metadata = ref(null);
const etag = ref("");
const selectedFile = ref(null);
const selectedFileTarget = ref(null);
const fileInput = ref(null);
const loading = ref(false);
const uploading = ref(false);
const publishing = ref(false);
const errorTitle = ref("");
const errorMessage = ref("");
const stale = ref(false);
const notice = ref("");
let uploadController = null;
const route = useRoute();

const busy = computed(() => loading.value || uploading.value || publishing.value);
const draftVersions = computed(() => versions.value.filter((version) => version.state === "DRAFT"));
const positiveId = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};
const ids = () => ({
  problem: positiveId(problemId.value),
  version: positiveId(versionId.value),
});
const sameTarget = (left, right) => Boolean(
  left
  && right
  && left.problem === right.problem
  && left.version === right.version,
);

const clearSelectedFile = () => {
  selectedFile.value = null;
  selectedFileTarget.value = null;
  if (fileInput.value) fileInput.value.value = "";
};

const clearFileForChangedTarget = () => {
  if (selectedFileTarget.value && !sameTarget(selectedFileTarget.value, ids())) {
    clearSelectedFile();
  }
};

const clearError = () => {
  errorTitle.value = "";
  errorMessage.value = "";
  stale.value = false;
};

const recordError = (error) => {
  const status = error?.response?.status;
  const [title, message] = STATUS_MESSAGES[status] || [
    "测试包操作失败",
    error?.response?.data?.message || error?.message || "请检查网络连接后重试。",
  ];
  errorTitle.value = title;
  errorMessage.value = message;
  stale.value = status === 412;
};

const requireIds = () => {
  const value = ids();
  if (value.problem && value.version) return value;
  errorTitle.value = "请求格式不正确";
  errorMessage.value = "题目 ID 和草稿版本 ID 必须是正整数。";
  return null;
};

const requireProblemId = () => {
  const value = positiveId(problemId.value);
  if (value) return value;
  errorTitle.value = "请求格式不正确";
  errorMessage.value = "题目 ID 必须是正整数。";
  return null;
};

const applyResponse = (response) => {
  metadata.value = response.data;
  etag.value = response.etag;
};

const loadVersions = async () => {
  if (busy.value) return;
  const value = requireProblemId();
  if (!value) return;
  loading.value = true;
  notice.value = "";
  clearError();
  metadata.value = null;
  etag.value = "";
  try {
    const response = await adminTestBundleApi.listVersions(value);
    versions.value = Array.isArray(response.data) ? response.data : [];
    const selectedStillExists = draftVersions.value.some(
      (version) => String(version.versionId) === String(versionId.value),
    );
    if (!selectedStillExists) versionId.value = "";
    if (!draftVersions.value.length) {
      notice.value = "这个题目目前没有可管理的草稿版本。";
    }
  } catch (error) {
    versions.value = [];
    versionId.value = "";
    recordError(error);
  } finally {
    loading.value = false;
  }
};

const loadMetadata = async () => {
  if (busy.value) return;
  const value = requireIds();
  if (!value) return;
  loading.value = true;
  notice.value = "";
  clearError();
  try {
    applyResponse(await adminTestBundleApi.describe(value.problem, value.version));
  } catch (error) {
    metadata.value = null;
    etag.value = "";
    recordError(error);
  } finally {
    loading.value = false;
  }
};

const handleProblemTargetChange = () => {
  clearFileForChangedTarget();
};

const handleVersionTargetChange = async () => {
  clearFileForChangedTarget();
  await loadMetadata();
};

const refreshMetadata = async () => {
  clearError();
  await loadMetadata();
};

const selectFile = (event) => {
  const file = event.target.files?.[0] || null;
  notice.value = "";
  clearError();
  if (file && !/\.zip$/i.test(file.name)) {
    clearSelectedFile();
    errorTitle.value = "请求格式不正确";
    errorMessage.value = "TestBundle 必须是 .zip 文件。";
    return;
  }
  selectedFile.value = file;
  selectedFileTarget.value = file ? ids() : null;
};

const uploadBundle = async () => {
  const value = requireIds();
  if (!value || !selectedFile.value || !etag.value || uploading.value) return;
  if (!sameTarget(selectedFileTarget.value, value)) {
    clearSelectedFile();
    errorTitle.value = "测试包目标已经变化";
    errorMessage.value = "请为当前题目和草稿版本重新选择 TestBundle ZIP。";
    return;
  }
  uploading.value = true;
  notice.value = "";
  clearError();
  const controller = new AbortController();
  uploadController = controller;
  try {
    applyResponse(await adminTestBundleApi.upload(
      value.problem,
      value.version,
      selectedFile.value,
      etag.value,
      { signal: controller.signal },
    ));
    notice.value = "测试包已通过校验并附加；发布前请核对摘要。";
  } catch (error) {
    if (controller.signal.aborted || error?.code === "ERR_CANCELED") {
      notice.value = "上传已取消，文件仍保留。";
    } else {
      recordError(error);
    }
  } finally {
    if (uploadController === controller) uploadController = null;
    uploading.value = false;
  }
};

const cancelUpload = () => uploadController?.abort();

const publishBundle = async () => {
  const value = requireIds();
  if (!value || !etag.value || publishing.value) return;
  publishing.value = true;
  notice.value = "";
  clearError();
  try {
    applyResponse(await adminTestBundleApi.publish(value.problem, value.version, etag.value));
    notice.value = "题目版本及其不可变测试包已发布。";
  } catch (error) {
    recordError(error);
  } finally {
    publishing.value = false;
  }
};

const formatBytes = (bytes) => bytes < 1024 * 1024
  ? `${(bytes / 1024).toFixed(1)} KiB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;

onMounted(() => {
  const queryProblemId = Array.isArray(route.query.problemId)
    ? route.query.problemId[0]
    : route.query.problemId;
  if (positiveId(queryProblemId)) {
    problemId.value = String(queryProblemId);
    loadVersions();
  }
});
onUnmounted(cancelUpload);
</script>

<style scoped>
.bundle-page { max-width: 980px; margin: 0 auto; display: grid; gap: 18px; color: var(--text-color); }
.page-heading { padding-bottom: 20px; border-bottom: 1px solid var(--border-color-light); }
.page-heading h2 { margin: 0; font: 600 32px/1.2 ui-serif, Georgia, serif; letter-spacing: -.03em; }
.page-heading p:last-child { margin: 7px 0 0; color: var(--text-color-secondary); }
.eyebrow { margin: 0 0 6px; color: var(--accent-color); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.lookup-panel { display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 14px; padding: 18px; border: 1px solid var(--border-color-light); border-radius: 14px; background: var(--card-bg); }
label { display: grid; gap: 7px; font-weight: 650; }
input, select { min-width: 0; padding: 10px 12px; border: 1px solid var(--input-border); border-radius: 8px; color: var(--input-text); background: var(--input-bg); font: inherit; }
button { padding: 9px 13px; border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-color); background: var(--card-bg); cursor: pointer; font: inherit; font-weight: 650; }
button:disabled { cursor: not-allowed; opacity: .5; }
.primary-button { border-color: #3b3733; color: #fffaf5; background: #3b3733; }
.publish-button { border-color: var(--accent-color); color: var(--accent-color); }
.state-panel, .notice { padding: 14px 16px; border-radius: 10px; }
.state-panel { display: flex; justify-content: space-between; gap: 18px; border: 1px solid #e5b7aa; color: #873e31; background: #fff6f2; }
.state-panel p { margin: 4px 0 0; }
.notice { margin: 0; color: #496248; background: #eff5ed; }
.metadata-panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid var(--border-color-light); border-radius: 14px; overflow: hidden; background: var(--card-bg); }
.metadata-panel div { min-width: 0; display: grid; gap: 7px; padding: 16px 18px; border-bottom: 1px solid var(--border-color-light); }
.metadata-panel div:nth-child(odd) { border-right: 1px solid var(--border-color-light); }
.metadata-panel span { color: var(--text-color-secondary); font-size: 12px; }
.metadata-panel code { overflow-wrap: anywhere; }
.action-panel { padding: 20px; border: 1px solid var(--border-color-light); border-radius: 14px; background: var(--card-bg); }
.file-field { max-width: 520px; }
.selected-file { color: var(--text-color-secondary); font-size: 13px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
@media (max-width: 720px) {
  .lookup-panel { grid-template-columns: 1fr; }
  .metadata-panel { grid-template-columns: 1fr; }
  .metadata-panel div:nth-child(odd) { border-right: 0; }
  .state-panel { flex-direction: column; }
}
</style>
