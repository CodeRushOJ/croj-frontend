<template>
  <article class="post-card">
    <div class="post-card__meta">
      <el-tag size="small" effect="plain">{{ post.category || "综合讨论" }}</el-tag>
      <time :datetime="post.createdAt">{{ formatDate(post.createdAt) }}</time>
    </div>
    <router-link class="post-card__title" :to="{ name: 'ForumPostDetail', params: { postId: post.id } }">
      {{ post.title }}
    </router-link>
    <p>{{ post.summary || excerpt(post.content) }}</p>
    <footer>
      <span class="author"><el-avatar :size="24" :src="post.author?.avatar" /> {{ post.author?.username || "匿名用户" }}</span>
      <span class="metrics">{{ post.commentCount || 0 }} 回复 · {{ post.viewCount || 0 }} 浏览</span>
    </footer>
  </article>
</template>

<script setup>
defineProps({ post: { type: Object, required: true } });

const excerpt = (value = "") => value.length > 110 ? `${value.slice(0, 110)}…` : value;
const formatDate = (value) => value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(value)) : "刚刚";
</script>

<style scoped>
.post-card {
  padding: 22px 24px;
  border: 1px solid var(--border-color-light);
  border-radius: 18px;
  background: var(--card-bg);
  box-shadow: 0 8px 30px var(--shadow-color);
  transition: transform .2s ease, border-color .2s ease;
}
.post-card:hover { transform: translateY(-2px); border-color: var(--el-color-primary-light-5); }
.post-card__meta, footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.post-card__meta time, .metrics { color: var(--text-color-secondary); font-size: 12px; }
.post-card__title { display: block; margin: 14px 0 8px; color: var(--text-color); font-size: 19px; font-weight: 750; line-height: 1.35; }
.post-card p { margin: 0 0 18px; color: var(--text-color-secondary); }
.author { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
@media (max-width: 600px) { .post-card { padding: 18px; } footer { align-items: flex-start; flex-direction: column; } }
</style>
