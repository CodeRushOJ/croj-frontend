<template>
  <section class="announcement-desk" :aria-busy="mutationLoading">
    <header class="desk-header">
      <div>
        <p class="eyebrow">PUBLICATION DESK</p>
        <h2>公告管理</h2>
        <p>从草稿到发布窗口，全程使用服务器版本防止并发覆盖。</p>
      </div>
      <button class="primary-button" type="button" :disabled="mutationLoading || forbidden" @click="openCreate">新建公告</button>
    </header>

    <div class="desk-toolbar">
      <label for="announcement-status">公告状态</label>
      <select id="announcement-status" v-model="statusFilter" :disabled="mutationLoading || forbidden" @change="applyFilter">
        <option value="">全部状态</option>
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span>{{ total }} 条记录</span>
    </div>

    <div v-if="forbidden" class="state-panel state-panel--error" role="alert">
      <strong>没有公告管理权限</strong>
      <p>请使用管理员账号登录，或联系超级管理员检查角色。</p>
    </div>

    <div v-else-if="loading" class="state-panel" role="status">管理公告加载中</div>

    <div v-else-if="loadError" class="state-panel state-panel--error" role="alert">
      <strong>公告工作台加载失败</strong>
      <p>{{ loadError }}</p>
      <button type="button" @click="loadAnnouncements">重新加载</button>
    </div>

    <div v-else-if="!items.length" class="state-panel">
      <strong>当前筛选下没有公告</strong>
      <p>创建一条草稿，或切换状态筛选。</p>
    </div>

    <div v-else class="announcement-records">
      <article v-for="item in items" :key="item.id" class="record-card">
        <div class="record-card__body">
          <div class="record-card__meta">
            <span class="lifecycle-pill" :data-status="item.status">{{ statusLabel(item.status) }}</span>
            <span v-if="item.status !== item.storedLifecycle" class="stored-state">
              库内 {{ statusLabel(item.storedLifecycle) }}
            </span>
            <span v-if="item.pinned">置顶 #{{ item.pinOrder }}</span>
            <span>v{{ item.version }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ summary(item.contentMarkdown) }}</p>
          <div class="record-card__window">
            <span v-if="item.publishAt">发布 {{ formatDate(item.publishAt) }}</span>
            <span v-if="item.expiresAt">结束 {{ formatDate(item.expiresAt) }}</span>
            <span v-if="!item.publishAt">尚未设置发布窗口</span>
          </div>
        </div>

        <div class="record-actions" :aria-label="`${item.title} 操作`">
          <button
            v-if="item.storedLifecycle !== 'ARCHIVED'"
            type="button"
            :disabled="mutationLoading || forbidden"
            :aria-label="`编辑 ${item.title}`"
            @click="openEdit(item)"
          >编辑</button>
          <button
            v-if="item.storedLifecycle !== 'ARCHIVED'"
            type="button"
            :disabled="mutationLoading || forbidden"
            :aria-label="`排期 ${item.title}`"
            @click="openSchedule(item)"
          >排期</button>
          <button
            v-if="item.storedLifecycle !== 'ARCHIVED'"
            type="button"
            :disabled="mutationLoading || forbidden"
            :aria-label="`立即发布 ${item.title}`"
            @click="openPublish(item)"
          >立即发布</button>
          <button
            v-if="['SCHEDULED', 'PUBLISHED'].includes(item.storedLifecycle)"
            type="button"
            :disabled="mutationLoading || forbidden"
            :aria-label="`撤回 ${item.title}`"
            @click="withdraw(item)"
          >撤回</button>
          <button
            v-if="item.storedLifecycle !== 'ARCHIVED'"
            class="danger-button"
            type="button"
            :disabled="mutationLoading || forbidden"
            :aria-label="`归档 ${item.title}`"
            @click="archive(item)"
          >归档</button>
          <span v-if="item.storedLifecycle === 'ARCHIVED'" class="immutable-note">已归档，只读</span>
        </div>
      </article>
    </div>

    <el-pagination
      v-if="total > pageSize"
      class="pagination"
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="page"
      @current-change="changePage"
    />

    <section v-if="editorOpen" class="editor-panel" aria-labelledby="announcement-editor-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">{{ editor.id ? `VERSION ${editor.version}` : "NEW DRAFT" }}</p>
          <h3 id="announcement-editor-title">{{ editor.id ? "编辑公告" : "新建公告" }}</h3>
        </div>
        <button type="button" aria-label="关闭公告编辑" :disabled="mutationLoading" @click="closePanels">关闭</button>
      </div>

      <form aria-label="公告编辑" @submit.prevent="saveEditor">
        <label>
          <span>标题</span>
          <input ref="editorTitleInput" v-model.trim="editor.title" :readonly="forbidden" required maxlength="200" />
        </label>
        <label>
          <span>正文</span>
          <textarea v-model.trim="editor.contentMarkdown" :readonly="forbidden" required maxlength="100000" rows="10" />
        </label>
        <div class="form-row">
          <label class="checkbox-label">
            <input v-model="editor.pinned" type="checkbox" :disabled="forbidden" />
            <span>置顶</span>
          </label>
          <label>
            <span>置顶顺序</span>
            <input v-model.number="editor.pinOrder" type="number" min="0" max="10000" :readonly="forbidden" />
          </label>
        </div>
        <p class="field-help">数字越小，置顶公告越靠前；非置顶公告忽略此值。</p>
        <button class="primary-button" type="submit" :disabled="mutationLoading || forbidden">
          {{ mutationLoading ? "保存中…" : editor.id ? "保存修改" : "保存草稿" }}
        </button>
      </form>
    </section>

    <section v-if="scheduleTarget" class="editor-panel" aria-labelledby="schedule-title">
      <div class="panel-heading">
        <div><p class="eyebrow">UTC WINDOW</p><h3 id="schedule-title">排期：{{ scheduleTarget.title }}</h3></div>
        <button type="button" aria-label="关闭排期" :disabled="mutationLoading" @click="closePanels">关闭</button>
      </div>
      <form aria-label="公告排期" @submit.prevent="schedule">
        <div class="form-row">
          <label><span>发布时间</span><input ref="scheduleInput" v-model="scheduleForm.publishAt" type="datetime-local" :readonly="forbidden" required /></label>
          <label><span>结束时间</span><input v-model="scheduleForm.expiresAt" type="datetime-local" :readonly="forbidden" /></label>
        </div>
        <p class="field-help">按当前浏览器时区填写，提交时转换为 UTC。结束时间必须晚于发布时间。</p>
        <button class="primary-button" type="submit" :disabled="mutationLoading || forbidden">
          {{ mutationLoading ? "排期中…" : "确认排期" }}
        </button>
      </form>
    </section>

    <section v-if="publishTarget" class="editor-panel" aria-labelledby="publish-title">
      <div class="panel-heading">
        <div><p class="eyebrow">PUBLISH NOW</p><h3 id="publish-title">立即发布：{{ publishTarget.title }}</h3></div>
        <button type="button" aria-label="关闭立即发布" :disabled="mutationLoading" @click="closePanels">关闭</button>
      </div>
      <form aria-label="立即发布公告" @submit.prevent="publish">
        <label><span>结束时间（可选）</span><input ref="publishInput" v-model="publishExpiresAt" type="datetime-local" :readonly="forbidden" /></label>
        <p class="field-help">留空表示长期展示；实际发布时间由服务器生成。</p>
        <button class="primary-button" type="submit" :disabled="mutationLoading || forbidden">
          {{ mutationLoading ? "发布中…" : "确认立即发布" }}
        </button>
      </form>
    </section>

    <div v-if="conflict" class="conflict-panel" role="alert">
      <div>
        <strong>其他管理员已经修改了这条公告</strong>
        <p>你的输入仍保留。刷新后会以服务器最新版本替换当前编辑快照，请先确认。</p>
      </div>
      <button type="button" :disabled="mutationLoading || forbidden" @click="refreshConflict">刷新服务器版本</button>
    </div>

    <div v-if="mutationError" class="mutation-error" role="alert">{{ mutationError }}</div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import {
  adminAnnouncementApi,
  isAnnouncementConflict,
  isAnnouncementForbidden,
} from "@/api/announcement";

const statusOptions = [
  { value: "DRAFT", label: "草稿" },
  { value: "SCHEDULED", label: "已排期" },
  { value: "PUBLISHED", label: "已发布" },
  { value: "EXPIRED", label: "已结束" },
  { value: "ARCHIVED", label: "已归档" },
];

const items = ref([]);
const page = ref(1);
const pageSize = 12;
const total = ref(0);
const statusFilter = ref("");
const loading = ref(true);
const forbidden = ref(false);
const loadError = ref("");
const mutationLoading = ref(false);
const mutationError = ref("");
const conflict = ref(null);
const editorOpen = ref(false);
const editorTitleInput = ref(null);
const scheduleInput = ref(null);
const publishInput = ref(null);
const scheduleTarget = ref(null);
const publishTarget = ref(null);
const publishExpiresAt = ref("");

const editor = reactive({ id: null, version: null, title: "", contentMarkdown: "", pinned: false, pinOrder: 0 });
const scheduleForm = reactive({ publishAt: "", expiresAt: "" });

const statusLabel = (status) => statusOptions.find((option) => option.value === status)?.label || status;
const formatDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "";
const summary = (value = "") => value.replace(/\s+/g, " ").trim().slice(0, 140);
const toInstant = (value) => value ? new Date(value).toISOString() : null;

const listParams = () => ({
  page: page.value,
  size: pageSize,
  ...(statusFilter.value ? { status: statusFilter.value } : {}),
});

const loadAnnouncements = async () => {
  loading.value = true;
  forbidden.value = false;
  loadError.value = "";
  try {
    const response = await adminAnnouncementApi.list(listParams());
    items.value = response.data?.items || [];
    total.value = response.data?.total || 0;
  } catch (error) {
    items.value = [];
    total.value = 0;
    if (isAnnouncementForbidden(error)) forbidden.value = true;
    else loadError.value = "请检查网络连接后重新加载。";
  } finally {
    loading.value = false;
  }
};

const resetEditor = (item = null) => Object.assign(editor, item ? {
  id: item.id,
  version: item.version,
  title: item.title,
  contentMarkdown: item.contentMarkdown,
  pinned: item.pinned,
  pinOrder: item.pinOrder,
} : { id: null, version: null, title: "", contentMarkdown: "", pinned: false, pinOrder: 0 });

const closePanels = () => {
  editorOpen.value = false;
  scheduleTarget.value = null;
  publishTarget.value = null;
  mutationError.value = "";
};

const focusAfterRender = (target) => nextTick(() => target.value?.focus());
const openCreate = () => {
  closePanels(); conflict.value = null; resetEditor(); editorOpen.value = true; focusAfterRender(editorTitleInput);
};
const openEdit = (item) => {
  closePanels(); conflict.value = null; resetEditor(item); editorOpen.value = true; focusAfterRender(editorTitleInput);
};
const openSchedule = (item) => {
  closePanels();
  conflict.value = null;
  scheduleTarget.value = item;
  scheduleForm.publishAt = "";
  scheduleForm.expiresAt = "";
  focusAfterRender(scheduleInput);
};
const openPublish = (item) => {
  closePanels(); conflict.value = null; publishTarget.value = item; publishExpiresAt.value = ""; focusAfterRender(publishInput);
};

const recordFailure = (error, itemId) => {
  if (isAnnouncementConflict(error)) {
    conflict.value = { itemId };
    return;
  }
  if (isAnnouncementForbidden(error)) {
    forbidden.value = true;
    conflict.value = null;
    mutationError.value = "公告管理权限已经变化；当前输入保留为只读，请复制后联系管理员。";
    return;
  }
  mutationError.value = error?.response?.data?.message || "操作失败，请检查状态和发布窗口后重试。";
};

const mutate = async (operation, itemId, { close = true } = {}) => {
  if (mutationLoading.value) return false;
  mutationLoading.value = true;
  mutationError.value = "";
  conflict.value = null;
  try {
    await operation();
    if (close) closePanels();
    await loadAnnouncements();
    return true;
  } catch (error) {
    recordFailure(error, itemId);
    return false;
  } finally {
    mutationLoading.value = false;
  }
};

const saveEditor = async () => {
  const payload = {
    title: editor.title,
    contentMarkdown: editor.contentMarkdown,
    pinned: editor.pinned,
    pinOrder: Number(editor.pinOrder),
  };
  if (editor.id) await mutate(() => adminAnnouncementApi.update(editor.id, editor.version, payload), editor.id);
  else await mutate(() => adminAnnouncementApi.create(payload), null);
};

const schedule = async () => {
  const item = scheduleTarget.value;
  const publishAt = toInstant(scheduleForm.publishAt);
  const expiresAt = toInstant(scheduleForm.expiresAt);
  if (expiresAt && expiresAt <= publishAt) {
    mutationError.value = "结束时间必须晚于发布时间。";
    return;
  }
  await mutate(() => adminAnnouncementApi.schedule(item.id, item.version, { publishAt, expiresAt }), item.id);
};

const publish = async () => {
  const item = publishTarget.value;
  await mutate(
    () => adminAnnouncementApi.publish(item.id, item.version, { expiresAt: toInstant(publishExpiresAt.value) }),
    item.id,
  );
};

const withdraw = (item) => mutate(() => adminAnnouncementApi.withdraw(item.id, item.version), item.id);
const archive = (item) => {
  if (!window.confirm(`归档“${item.title}”后将无法修改或重新发布，确定继续吗？`)) return;
  mutate(() => adminAnnouncementApi.archive(item.id, item.version), item.id);
};

const refreshConflict = async () => {
  const itemId = conflict.value?.itemId;
  if (!itemId) return;
  mutationLoading.value = true;
  mutationError.value = "";
  try {
    // A conflicting write updates the record and may move it off the current page
    // or out of the active lifecycle filter. Always request the newest unfiltered page.
    const response = await adminAnnouncementApi.list({ page: 1, size: 100 });
    const latest = response.data?.items?.find((item) => item.id === itemId);
    if (!latest) {
      mutationError.value = "未能定位服务器最新版本；你的输入仍已保留，请稍后重试。";
      return;
    }
    items.value = items.value.map((item) => item.id === itemId ? latest : item);
    if (latest.storedLifecycle === "ARCHIVED") {
      closePanels();
      mutationError.value = "公告已被其他管理员归档，当前记录只能查看。";
      conflict.value = null;
      return;
    }
    if (editorOpen.value && editor.id === itemId) resetEditor(latest);
    if (scheduleTarget.value?.id === itemId) scheduleTarget.value = latest;
    if (publishTarget.value?.id === itemId) publishTarget.value = latest;
    conflict.value = null;
  } catch (error) {
    if (isAnnouncementForbidden(error)) {
      forbidden.value = true;
      conflict.value = null;
      mutationError.value = "公告管理权限已经变化；当前输入保留为只读，请复制后联系管理员。";
    } else {
      mutationError.value = "服务器版本刷新失败，请保留当前内容并稍后重试。";
    }
  } finally {
    mutationLoading.value = false;
  }
};

const applyFilter = () => { page.value = 1; loadAnnouncements(); };
const changePage = (nextPage) => { page.value = nextPage; loadAnnouncements(); };

onMounted(loadAnnouncements);
</script>

<style scoped>
.announcement-desk { max-width: 1050px; margin: 0 auto; color: var(--text-color); }
.desk-header { display: flex; justify-content: space-between; align-items: end; gap: 24px; padding-bottom: 22px; border-bottom: 1px solid var(--border-color-light); }
.eyebrow { margin: 0 0 5px; color: var(--accent-color); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.desk-header h2, .panel-heading h3 { margin: 0; font-family: ui-serif, Georgia, serif; font-weight: 600; letter-spacing: -.025em; }
.desk-header h2 { font-size: 32px; }
.desk-header p:last-child { margin: 7px 0 0; color: var(--text-color-secondary); }
button, select, input, textarea { font: inherit; }
button { border: 1px solid var(--border-color); border-radius: 8px; padding: 7px 11px; color: var(--text-color); background: var(--card-bg); cursor: pointer; }
button:hover { border-color: var(--accent-color); }
button:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid color-mix(in srgb, var(--accent-color) 30%, transparent); outline-offset: 2px; }
button:disabled { cursor: wait; opacity: .6; }
.primary-button { border-color: #3b3733; color: #fffaf5; background: #3b3733; font-weight: 650; }
.danger-button { color: #a34232; }
.desk-toolbar { display: flex; align-items: center; gap: 10px; padding: 18px 0; color: var(--text-color-secondary); }
.desk-toolbar label { font-weight: 700; color: var(--text-color); }
.desk-toolbar select { min-width: 150px; border: 1px solid var(--border-color); border-radius: 8px; padding: 7px 30px 7px 10px; color: var(--text-color); background: var(--input-bg); }
.desk-toolbar span { margin-left: auto; font-size: 12px; }
.state-panel { min-height: 180px; display: grid; place-content: center; justify-items: center; padding: 24px; border: 1px dashed var(--border-color); border-radius: 14px; text-align: center; background: var(--card-bg); }
.state-panel p { color: var(--text-color-secondary); }
.state-panel--error strong, .mutation-error { color: #a34232; }
.announcement-records { display: grid; gap: 10px; }
.record-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; padding: 20px; border: 1px solid var(--border-color-light); border-radius: 13px; background: var(--card-bg); }
.record-card__meta, .record-card__window { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; color: var(--text-color-secondary); font-size: 11px; }
.lifecycle-pill { padding: 3px 8px; border-radius: 999px; color: var(--accent-color); background: var(--accent-color-soft); font-weight: 800; }
.lifecycle-pill[data-status="ARCHIVED"], .lifecycle-pill[data-status="EXPIRED"] { color: var(--text-color-secondary); background: var(--border-color-light); }
.record-card h3 { margin: 9px 0 5px; font-size: 18px; }
.record-card__body > p { margin: 0 0 12px; color: var(--text-color-secondary); }
.record-actions { max-width: 260px; display: flex; align-content: flex-start; justify-content: flex-end; flex-wrap: wrap; gap: 7px; }
.immutable-note { color: var(--text-color-secondary); font-size: 12px; }
.pagination { justify-content: center; margin: 24px 0; }
.editor-panel { margin-top: 22px; padding: 22px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--card-bg); box-shadow: 0 12px 32px var(--shadow-color); }
.panel-heading { display: flex; justify-content: space-between; align-items: start; gap: 20px; margin-bottom: 18px; }
.panel-heading h3 { font-size: 24px; }
form { display: grid; gap: 15px; }
form label { display: grid; gap: 6px; font-weight: 650; }
input, textarea { width: 100%; border: 1px solid var(--input-border); border-radius: 8px; padding: 9px 11px; color: var(--input-text); background: var(--input-bg); }
textarea { resize: vertical; line-height: 1.65; }
.form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.checkbox-label { display: flex; flex-direction: row; align-items: center; gap: 8px; }
.checkbox-label input { width: auto; }
.field-help { margin: -6px 0 0; color: var(--text-color-secondary); font-size: 12px; }
form .primary-button { justify-self: start; }
.conflict-panel { position: sticky; bottom: 14px; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 18px; padding: 16px; border: 1px solid #c78664; border-radius: 12px; background: #fff4eb; box-shadow: 0 12px 30px rgba(77, 45, 27, .15); }
[data-theme="dark"] .conflict-panel { background: #33231d; }
.conflict-panel p { margin: 3px 0 0; color: var(--text-color-secondary); }
.mutation-error { margin-top: 12px; padding: 12px; border-radius: 9px; background: var(--tag-danger-bg); }
@media (max-width: 760px) {
  .desk-header { align-items: flex-start; flex-direction: column; }
  .record-card { grid-template-columns: 1fr; }
  .record-actions { max-width: none; justify-content: flex-start; }
  .form-row { grid-template-columns: 1fr; }
  .conflict-panel { align-items: flex-start; flex-direction: column; }
}
</style>
