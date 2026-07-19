<template>
  <div class="announcement-detail">
    <AsyncState
      :loading="loading"
      :error="error"
      :empty="!announcement"
      empty-title="公告不存在或已结束展示"
      empty-description="返回公告列表查看仍在展示的内容。"
      @retry="loadAnnouncement"
    >
      <article v-if="announcement">
        <router-link class="back-link" :to="{ name: 'Announcements' }">← 返回公告</router-link>
        <header>
          <div class="announcement-meta">
            <span v-if="announcement.pinned" class="status-pill">置顶</span>
            <time :datetime="announcement.publishAt">发布于 {{ formatDate(announcement.publishAt) }}</time>
          </div>
          <h1>{{ announcement.title }}</h1>
          <p v-if="announcement.expiresAt" class="expiry">展示至 {{ formatDate(announcement.expiresAt) }}</p>
        </header>
        <pre class="announcement-body">{{ announcement.contentMarkdown }}</pre>
      </article>
    </AsyncState>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { announcementApi } from "@/api/announcement";
import AsyncState from "@/components/community/AsyncState.vue";

const route = useRoute();
const announcement = ref(null);
const loading = ref(true);
const error = ref("");

const formatDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(new Date(value))
  : "";

const loadAnnouncement = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await announcementApi.detail(route.params.announcementId);
    announcement.value = response.data || null;
  } catch (requestError) {
    announcement.value = null;
    error.value = requestError?.response?.status === 404
      ? "这条公告不存在，或已经不在公开展示窗口内。"
      : "公告暂时无法加载，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

onMounted(loadAnnouncement);
</script>

<style scoped>
.announcement-detail { max-width: 820px; margin: 0 auto; padding: 10px 0 60px; }
.back-link { display: inline-block; margin-bottom: 30px; color: var(--text-color-secondary); }
.announcement-detail header { padding-bottom: 26px; border-bottom: 1px solid var(--border-color-light); }
.announcement-meta { display: flex; gap: 10px; align-items: center; color: var(--text-color-secondary); font-size: 12px; }
.status-pill { padding: 2px 8px; border-radius: 999px; color: var(--accent-color); background: var(--accent-color-soft); font-weight: 700; }
.announcement-detail h1 { max-width: 680px; margin: 12px 0 8px; font-family: ui-serif, Georgia, serif; font-size: clamp(30px, 5vw, 48px); font-weight: 600; line-height: 1.2; letter-spacing: -.035em; }
.expiry { margin: 0; color: var(--text-color-secondary); font-size: 13px; }
.announcement-body { margin: 0; padding: 34px 0; color: var(--text-color); background: transparent; border: 0; font: inherit; font-size: 16px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
