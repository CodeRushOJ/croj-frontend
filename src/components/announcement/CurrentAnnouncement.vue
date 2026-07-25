<template>
  <aside v-if="announcement" class="current-announcement" aria-label="当前公告">
    <router-link :to="{ name: 'AnnouncementDetail', params: { announcementId: announcement.id } }">
      <span v-if="announcement.pinned" class="current-announcement__pin">置顶</span>
      <span class="current-announcement__title">{{ announcement.title }}</span>
      <span aria-hidden="true">查看 →</span>
    </router-link>
  </aside>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { announcementApi } from "@/api/announcement";

const announcement = ref(null);

onMounted(async () => {
  try {
    const response = await announcementApi.current(1);
    announcement.value = response.data?.[0] || null;
  } catch {
    announcement.value = null;
  }
});
</script>

<style scoped>
.current-announcement {
  border-bottom: 1px solid var(--border-color-light);
  background: color-mix(in srgb, var(--accent-color-soft) 58%, var(--header-bg));
}

.current-announcement a {
  width: min(1180px, calc(100% - 40px));
  min-height: 38px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.current-announcement__pin {
  padding: 2px 7px;
  border: 1px solid color-mix(in srgb, var(--accent-color) 35%, transparent);
  border-radius: 999px;
  color: var(--accent-color);
  font-size: 11px;
  font-weight: 700;
}

.current-announcement__title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--text-color);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .current-announcement a { width: min(100% - 24px, 1180px); }
}
</style>
