<template>
  <section class="bundle-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">IMMUTABLE JUDGE DATA</p>
        <h2>测试包管理</h2>
        <p>上传 TestBundle v1/v2 ZIP，核对服务端验证结果后发布不可变题目版本。</p>
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
          :disabled="publishing"
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

    <section
      v-if="manifestPreview"
      class="manifest-panel"
      aria-label="不可变判题配置"
    >
      <header>
        <div>
          <p class="eyebrow">SERVER-VALIDATED MANIFEST</p>
          <h3>不可变判题配置</h3>
        </div>
        <span class="manifest-version">schema v{{ manifestPreview.schemaVersion }}</span>
      </header>

      <dl class="manifest-summary">
        <div><dt>计分模式</dt><dd>{{ manifestPreview.judgeMode }}</dd></div>
        <div><dt>输出校验</dt><dd>{{ manifestPreview.checker }}</dd></div>
        <div>
          <dt>选手限制</dt>
          <dd>{{ manifestPreview.limits.timeLimitMillis }} ms / {{ manifestPreview.limits.memoryLimitMiB }} MiB</dd>
        </div>
        <div v-if="manifestPreview.judgeMode === 'OI'">
          <dt>总分</dt><dd>{{ manifestPreview.totalScore }}</dd>
        </div>
      </dl>

      <div v-if="manifestPreview.specialJudge" class="special-preview">
        <div><span>SPJ 语言</span><strong>{{ manifestPreview.specialJudge.language }}</strong></div>
        <div><span>SPJ 文件</span><code>{{ manifestPreview.specialJudge.source }}</code></div>
        <div>
          <span>SPJ 限制</span>
          <strong>
            {{ manifestPreview.specialJudge.timeLimitMillis }} ms /
            {{ manifestPreview.specialJudge.memoryLimitMiB }} MiB
          </strong>
        </div>
        <div><span>SPJ SHA-256</span><code>{{ manifestPreview.specialJudge.sourceSha256 }}</code></div>
      </div>

      <div class="case-table-wrap">
        <table>
          <thead><tr><th scope="col">用例</th><th scope="col">权重</th></tr></thead>
          <tbody>
            <tr v-for="testCase in manifestPreview.cases" :key="testCase.id">
              <td><code>{{ testCase.id }}</code></td>
              <td>{{ testCase.weight }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
          :disabled="busy || !canPublish"
          @click="publishBundle"
        >发布题目版本</button>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
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
let targetEpoch = 0;
const route = useRoute();

const busy = computed(() => loading.value || uploading.value || publishing.value);
const draftVersions = computed(() => versions.value.filter((version) => version.state === "DRAFT"));
const manifestPreview = computed(() => metadata.value?.manifestPreview || null);
const canPublish = computed(() => Boolean(
  metadata.value?.attached
  && manifestPreview.value
  && metadata.value.state === "DRAFT"
  && etag.value,
));
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
const targetSnapshot = () => ({ ...ids(), epoch: targetEpoch });
const currentProblemTarget = (snapshot) => (
  snapshot.epoch === targetEpoch
  && snapshot.problem === positiveId(problemId.value)
);
const currentTarget = (snapshot) => (
  snapshot.epoch === targetEpoch
  && sameTarget(snapshot, ids())
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

const applyResponse = (response, snapshot) => {
  if (!currentTarget(snapshot)) return false;
  metadata.value = response.data;
  etag.value = response.etag;
  if (response.data?.attached && !response.data?.manifestPreview) {
    errorTitle.value = "服务器判题合同不完整";
    errorMessage.value = "已附加测试包的 manifest 预览不可用；为避免发布未知配置，操作已被阻止。";
    stale.value = false;
  }
  return true;
};

const describeTarget = async (snapshot) => {
  try {
    applyResponse(
      await adminTestBundleApi.describe(snapshot.problem, snapshot.version),
      snapshot,
    );
  } catch (error) {
    if (!currentTarget(snapshot)) return;
    metadata.value = null;
    etag.value = "";
    recordError(error);
  }
};

const loadVersions = async () => {
  if (busy.value) return;
  const value = requireProblemId();
  if (!value) return;
  const snapshot = { epoch: targetEpoch, problem: value };
  loading.value = true;
  notice.value = "";
  clearError();
  metadata.value = null;
  etag.value = "";
  try {
    const response = await adminTestBundleApi.listVersions(value);
    if (!currentProblemTarget(snapshot)) return;
    versions.value = Array.isArray(response.data) ? response.data : [];
    const selectedStillExists = draftVersions.value.some(
      (version) => String(version.versionId) === String(versionId.value),
    );
    if (selectedStillExists) {
      await describeTarget({ ...ids(), epoch: snapshot.epoch });
      if (!currentProblemTarget(snapshot)) return;
    } else {
      versionId.value = "";
    }
    if (!draftVersions.value.length) {
      notice.value = "这个题目目前没有可管理的草稿版本。";
    }
  } catch (error) {
    if (!currentProblemTarget(snapshot)) return;
    versions.value = [];
    versionId.value = "";
    recordError(error);
  } finally {
    if (snapshot.epoch === targetEpoch) loading.value = false;
  }
};

const loadMetadata = async () => {
  if (busy.value) return;
  const value = requireIds();
  if (!value) return;
  const snapshot = targetSnapshot();
  loading.value = true;
  notice.value = "";
  clearError();
  try {
    await describeTarget(snapshot);
  } finally {
    if (snapshot.epoch === targetEpoch) loading.value = false;
  }
};

const handleProblemTargetChange = () => {
  targetEpoch += 1;
  const activeUpload = uploadController;
  uploadController = null;
  loading.value = false;
  uploading.value = false;
  activeUpload?.abort();
  versions.value = [];
  versionId.value = "";
  metadata.value = null;
  etag.value = "";
  notice.value = "";
  clearError();
  clearSelectedFile();
};

const handleVersionTargetChange = async () => {
  targetEpoch += 1;
  clearFileForChangedTarget();
  metadata.value = null;
  etag.value = "";
  notice.value = "";
  clearError();
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
  const snapshot = targetSnapshot();
  const file = selectedFile.value;
  const currentEtag = etag.value;
  uploading.value = true;
  notice.value = "";
  clearError();
  const controller = new AbortController();
  uploadController = controller;
  try {
    applyResponse(await adminTestBundleApi.upload(
      value.problem,
      value.version,
      file,
      currentEtag,
      { signal: controller.signal },
    ), snapshot);
    if (currentTarget(snapshot)) {
      notice.value = "测试包已通过校验并附加；发布前请核对摘要。";
    }
  } catch (error) {
    if (!currentTarget(snapshot)) return;
    if (controller.signal.aborted || error?.code === "ERR_CANCELED") {
      notice.value = "上传已取消，文件仍保留。";
    } else {
      recordError(error);
    }
  } finally {
    if (uploadController === controller) {
      uploadController = null;
      uploading.value = false;
    }
  }
};

const cancelUpload = () => uploadController?.abort();

const publishBundle = async () => {
  const value = requireIds();
  if (!value || !canPublish.value || publishing.value) return;
  const snapshot = targetSnapshot();
  const currentEtag = etag.value;
  publishing.value = true;
  notice.value = "";
  clearError();
  try {
    applyResponse(
      await adminTestBundleApi.publish(value.problem, value.version, currentEtag),
      snapshot,
    );
    if (currentTarget(snapshot)) {
      notice.value = "题目版本及其不可变测试包已发布。";
    }
  } catch (error) {
    if (!currentTarget(snapshot)) return;
    notice.value = "";
    recordError(error);
  } finally {
    if (snapshot.epoch === targetEpoch) publishing.value = false;
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
onBeforeRouteLeave(() => {
  if (!publishing.value) return true;
  notice.value = "发布请求仍在处理中，请等待结果后再离开。";
  return false;
});
onUnmounted(() => {
  targetEpoch += 1;
  cancelUpload();
});
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
.manifest-panel { display: grid; gap: 18px; padding: 20px; border: 1px solid var(--border-color-light); border-radius: 14px; background: var(--card-bg); }
.manifest-panel header { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.manifest-panel h3 { margin: 0; font: 600 22px/1.2 ui-serif, Georgia, serif; }
.manifest-version { padding: 5px 8px; border: 1px solid var(--border-color-light); border-radius: 999px; color: var(--text-color-secondary); font-size: 12px; }
.manifest-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; border: 1px solid var(--border-color-light); border-radius: 10px; overflow: hidden; }
.manifest-summary div { min-width: 0; padding: 13px 14px; border-right: 1px solid var(--border-color-light); }
.manifest-summary div:last-child { border-right: 0; }
.manifest-summary dt, .special-preview span { color: var(--text-color-secondary); font-size: 12px; }
.manifest-summary dd { margin: 5px 0 0; font-weight: 700; overflow-wrap: anywhere; }
.special-preview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--border-color-light); border-radius: 10px; background: var(--border-color-light); }
.special-preview div { display: grid; gap: 6px; min-width: 0; padding: 13px 14px; background: var(--card-bg); }
.special-preview code { overflow-wrap: anywhere; }
.case-table-wrap { max-height: 320px; overflow: auto; border: 1px solid var(--border-color-light); border-radius: 10px; }
.case-table-wrap table { width: 100%; border-collapse: collapse; }
.case-table-wrap th, .case-table-wrap td { padding: 10px 13px; border-bottom: 1px solid var(--border-color-light); text-align: left; }
.case-table-wrap th { position: sticky; top: 0; color: var(--text-color-secondary); background: var(--card-bg); font-size: 12px; }
.case-table-wrap th:last-child, .case-table-wrap td:last-child { width: 120px; text-align: right; }
.case-table-wrap tbody tr:last-child td { border-bottom: 0; }
.file-field { max-width: 520px; }
.selected-file { color: var(--text-color-secondary); font-size: 13px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
@media (max-width: 720px) {
  .lookup-panel { grid-template-columns: 1fr; }
  .metadata-panel { grid-template-columns: 1fr; }
  .manifest-summary, .special-preview { grid-template-columns: 1fr; }
  .manifest-summary div { border-right: 0; border-bottom: 1px solid var(--border-color-light); }
  .manifest-summary div:last-child { border-bottom: 0; }
  .metadata-panel div:nth-child(odd) { border-right: 0; }
  .state-panel { flex-direction: column; }
}
</style>
