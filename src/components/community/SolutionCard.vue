<template>
  <article class="solution-card">
    <router-link :to="{ name: 'SolutionDetail', params: { problemId, solutionId: solution.id } }">
      <h3>{{ solution.title }}</h3>
    </router-link>
    <p>{{ excerpt(solution.content) }}</p>
    <footer>
      <span>{{ solution.author?.username || "匿名用户" }} · {{ formatDate(solution.createdAt) }}</span>
      <span>♥ {{ solution.likeCount || 0 }}</span>
    </footer>
  </article>
</template>

<script setup>
defineProps({
  problemId: { type: [String, Number], required: true },
  solution: { type: Object, required: true },
});
const excerpt = (value = "") => value.length > 140 ? `${value.slice(0, 140)}…` : value;
const formatDate = (value) => value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(value)) : "刚刚";
</script>

<style scoped>
.solution-card { padding: 20px; border: 1px solid var(--border-color-light); border-radius: 16px; background: var(--card-bg); }
.solution-card h3 { margin: 0 0 8px; font-size: 18px; }
.solution-card p { margin: 0 0 16px; color: var(--text-color-secondary); white-space: pre-wrap; }
.solution-card footer { display: flex; justify-content: space-between; gap: 12px; color: var(--text-color-secondary); font-size: 12px; }
</style>
