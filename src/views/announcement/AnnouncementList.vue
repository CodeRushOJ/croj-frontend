<template>
  <div class="announcement-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">UPDATES</p>
        <h1>公告</h1>
        <p>平台运行、比赛安排与重要功能更新。</p>
      </div>
    </header>

    <AsyncState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      empty-title="暂时没有公告"
      empty-description="新的平台动态会在这里发布。"
      @retry="loadAnnouncements"
    >
      <div class="announcement-list">
        <article v-for="item in items" :key="item.id" class="announcement-card">
          <div class="announcement-card__meta">
            <span v-if="item.pinned" class="status-pill">置顶</span>
            <time :datetime="item.publishAt">{{ formatDate(item.publishAt) }}</time>
            <span v-if="item.expiresAt">有效至 {{ formatDate(item.expiresAt) }}</span>
          </div>
          <h2>
            <router-link :to="{ name: 'AnnouncementDetail', params: { announcementId: item.id } }">
              {{ item.title }}
            </router-link>
          </h2>
          <p>{{ summary(item.contentMarkdown) }}</p>
        </article>
      </div>
    </AsyncState>

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
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { announcementApi } from "@/api/announcement";
import AsyncState from "@/components/community/AsyncState.vue";

const page = ref(1);
const pageSize = 20;
const total = ref(0);
const items = ref([]);
const loading = ref(true);
const error = ref("");

const formatDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "";

const summary = (value = "") => value
  .replace(/[#>*_`]/g, "")
  .replaceAll("[", "")
  .replaceAll("]", "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 180);

const loadAnnouncements = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await announcementApi.list({ page: page.value, size: pageSize });
    items.value = response.data?.items || [];
    total.value = response.data?.total || 0;
  } catch {
    items.value = [];
    total.value = 0;
    error.value = "公告暂时无法加载，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

const changePage = (nextPage) => {
  page.value = nextPage;
  loadAnnouncements();
};

onMounted(loadAnnouncements);
</script>

<style scoped>
.announcement-page { max-width: 860px; margin: 0 auto; padding: 10px 0 50px; }
.page-heading { display: flex; align-items: end; justify-content: space-between; padding: 18px 0 28px; border-bottom: 1px solid var(--border-color-light); margin-bottom: 18px; }
.eyebrow { margin: 0 0 6px; color: var(--accent-color); font-size: 11px; font-weight: 800; letter-spacing: .16em; }
.page-heading h1 { margin: 0; font-family: ui-serif, Georgia, serif; font-size: clamp(30px, 5vw, 46px); font-weight: 600; letter-spacing: -.035em; }
.page-heading p:last-child { margin: 8px 0 0; color: var(--text-color-secondary); }
.announcement-list { display: grid; gap: 2px; }
.announcement-card { padding: 24px 4px; border-bottom: 1px solid var(--border-color-light); }
.announcement-card__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; color: var(--text-color-secondary); font-size: 12px; }
.status-pill { padding: 2px 8px; border-radius: 999px; color: var(--accent-color); background: var(--accent-color-soft); font-weight: 700; }
.announcement-card h2 { margin: 10px 0 8px; font-size: 21px; letter-spacing: -.02em; }
.announcement-card h2 a { color: var(--text-color); }
.announcement-card h2 a:hover { color: var(--accent-color); }
.announcement-card p { margin: 0; color: var(--text-color-secondary); line-height: 1.7; }
.pagination { justify-content: center; margin-top: 28px; }
@media (max-width: 760px) { .announcement-page { padding-top: 0; } .announcement-card { padding-inline: 0; } }
</style>
