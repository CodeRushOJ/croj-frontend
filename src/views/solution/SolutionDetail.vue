<template>
  <div class="solution-page">
    <button class="back-link" type="button" @click="router.back()">← 返回题目</button>
    <AsyncState :loading="loading" :error="error" :empty="!solution" empty-title="题解不存在" @retry="loadSolution">
      <article class="solution-detail">
        <span class="eyebrow">SOLUTION</span>
        <h1>{{ solution.title }}</h1>
        <div class="meta"><span>{{ solution.author?.username || "匿名用户" }}</span><time>{{ formatDate(solution.createdAt) }}</time></div>
        <div class="content">{{ solution.content }}</div>
      </article>
    </AsyncState>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { solutionApi } from "@/api/community";
import { normalizeSolution } from "@/types/community";
import AsyncState from "@/components/community/AsyncState.vue";

const route = useRoute();
const router = useRouter();
const problemId = String(route.params.problemId);
const solution = ref(null);
const loading = ref(true);
const error = ref("");
const formatDate = (value) => value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)) : "刚刚";
const loadSolution = async () => {
  loading.value = true; error.value = "";
  try { solution.value = normalizeSolution((await solutionApi.get(problemId, route.params.solutionId)).data); }
  catch { error.value = "无法获取这篇题解，请稍后重试。"; }
  finally { loading.value = false; }
};
onMounted(loadSolution);
</script>

<style scoped>
.solution-page { max-width: 900px; margin: 0 auto; padding: 12px 8px 50px; }
.back-link { display: inline-block; padding: 0; margin-bottom: 16px; color: var(--el-color-primary); border: 0; background: none; cursor: pointer; font: inherit; }
.solution-detail { padding: clamp(24px, 5vw, 48px); border: 1px solid var(--border-color-light); border-radius: 24px; background: var(--card-bg); box-shadow: 0 14px 40px var(--shadow-color); }
.solution-detail h1 { margin: 9px 0 12px; font-size: clamp(28px, 4vw, 43px); line-height: 1.18; }
.eyebrow { color: var(--el-color-primary); font-size: 12px; font-weight: 800; letter-spacing: .18em; }
.meta { display: flex; gap: 14px; color: var(--text-color-secondary); }
.content { margin-top: 34px; font-size: 16px; line-height: 1.9; white-space: pre-wrap; }
</style>
