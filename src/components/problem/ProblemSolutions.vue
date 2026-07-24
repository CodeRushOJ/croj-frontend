<template>
  <section class="solutions">
    <header class="solutions__header">
      <div><h2>社区题解</h2><p>从不同视角理解算法，也欢迎分享你的推导过程。</p></div>
      <el-button type="primary" @click="drawerOpen = true">发布题解</el-button>
    </header>

    <AsyncState
      :loading="loading"
      :error="error"
      :empty="!solutions.length"
      empty-title="暂无题解，分享你的思路吧"
      empty-description="好的题解不只给出代码，也解释为什么正确。"
      @retry="loadSolutions"
    >
      <template #empty-action><el-button type="primary" plain @click="drawerOpen = true">写第一篇题解</el-button></template>
      <div class="solution-list"><SolutionCard v-for="solution in solutions" :key="solution.id" :problem-id="problemId" :solution="solution" /></div>
    </AsyncState>

    <el-drawer v-model="drawerOpen" title="发布题解" size="min(560px, 92vw)" destroy-on-close>
      <form class="solution-form" @submit.prevent="publish">
        <div><label for="solution-title">题解标题</label><input id="solution-title" v-model.trim="form.title" maxlength="100" placeholder="概括核心思路" /></div>
        <div><label for="solution-content">题解正文</label><textarea id="solution-content" v-model.trim="form.content" rows="14" maxlength="20000" placeholder="说明思路、正确性与复杂度；代码请附语言。" /></div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <div class="form-actions"><el-button @click="drawerOpen = false">取消</el-button><el-button native-type="submit" type="primary" :loading="publishing">确认发布</el-button></div>
      </form>
    </el-drawer>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { solutionApi } from "@/api/community";
import { normalizeCommunityPage, normalizeSolution } from "@/types/community";
import AsyncState from "@/components/community/AsyncState.vue";
import SolutionCard from "@/components/community/SolutionCard.vue";

const props = defineProps({ problemId: { type: [String, Number], required: true } });
const solutions = ref([]);
const loading = ref(true);
const error = ref("");
const drawerOpen = ref(false);
const publishing = ref(false);
const formError = ref("");
const form = reactive({ title: "", content: "" });

const loadSolutions = async () => {
  if (!props.problemId) return;
  loading.value = true; error.value = "";
  try {
    solutions.value = normalizeCommunityPage(
      (await solutionApi.list(props.problemId, { current: 1, size: 30 })).data,
    ).items.map(normalizeSolution);
  }
  catch { solutions.value = []; error.value = "题解加载失败，请稍后重试。"; }
  finally { loading.value = false; }
};
const publish = async () => {
  if (form.title.length < 4) { formError.value = "标题至少需要 4 个字符。"; return; }
  if (form.content.length < 20) { formError.value = "正文至少需要 20 个字符。"; return; }
  formError.value = ""; publishing.value = true;
  try {
    await solutionApi.create(props.problemId, { title: form.title, content: form.content });
    form.title = ""; form.content = ""; drawerOpen.value = false;
    await loadSolutions(); ElMessage.success("题解已发布");
  } catch { formError.value = "发布失败，内容已保留，请稍后重试。"; }
  finally { publishing.value = false; }
};
onMounted(loadSolutions);
watch(() => props.problemId, loadSolutions);
</script>

<style scoped>
.solutions { padding: 4px; }
.solutions__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.solutions__header h2 { margin: 0 0 5px; }.solutions__header p { margin: 0; color: var(--text-color-secondary); }
.solution-list { display: grid; gap: 12px; }
.solution-form, .solution-form > div { display: grid; gap: 9px; }.solution-form { gap: 22px; }
.solution-form label { font-weight: 700; }
.solution-form input, .solution-form textarea { width: 100%; padding: 13px 14px; resize: vertical; color: var(--input-text); border: 1px solid var(--input-border); border-radius: 12px; outline: none; background: var(--input-bg); font: inherit; line-height: 1.65; }
.solution-form input:focus, .solution-form textarea:focus { border-color: var(--el-color-primary); }
.form-actions { display: flex !important; grid-auto-flow: column; justify-content: end; }.form-error { margin: 0; color: var(--el-color-danger); }
@media (max-width: 600px) { .solutions__header { flex-direction: column; } }
</style>
