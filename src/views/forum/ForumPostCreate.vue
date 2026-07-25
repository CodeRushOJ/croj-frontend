<template>
  <div class="compose-page">
    <header><span class="eyebrow">NEW DISCUSSION</span><h1>发起一场有价值的讨论</h1><p>清晰描述背景、已经尝试的方法，以及你真正困惑的地方。</p></header>
    <form class="compose-card" @submit.prevent="submitPost">
      <div class="field"><label for="post-title">标题</label><input id="post-title" v-model.trim="form.title" maxlength="100" placeholder="用一句话说清讨论主题" /></div>
      <div class="field"><label for="post-category">分类</label><select id="post-category" v-model="form.categoryId" :disabled="categoryLoading"><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select><small v-if="categoryError" class="form-error">{{ categoryError }}</small></div>
      <div class="field"><label for="post-content">正文</label><textarea id="post-content" v-model.trim="form.content" rows="12" maxlength="10000" placeholder="支持纯文本；代码片段请注明语言和上下文。" /></div>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="actions"><router-link :to="{ name: 'Forum' }"><el-button>取消</el-button></router-link><el-button native-type="submit" type="primary" :loading="submitting" :disabled="categoryLoading || !form.categoryId">发布讨论</el-button></div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { forumApi } from "@/api/community";

const router = useRouter();
const categories = ref([]);
const form = reactive({ title: "", categoryId: null, content: "" });
const error = ref("");
const submitting = ref(false);
const categoryLoading = ref(true);
const categoryError = ref("");
const loadCategories = async () => {
  categoryLoading.value = true; categoryError.value = "";
  try {
    categories.value = (await forumApi.listCategories()).data || [];
    form.categoryId = categories.value[0]?.id ?? null;
    if (!form.categoryId) categoryError.value = "暂无可用分类，请联系管理员。";
  } catch { categoryError.value = "分类加载失败，请刷新后重试。"; }
  finally { categoryLoading.value = false; }
};
const submitPost = async () => {
  if (!form.categoryId) { error.value = "请选择有效分类。"; return; }
  if (form.title.length < 5) { error.value = "标题至少需要 5 个字符。"; return; }
  if (form.content.length < 20) { error.value = "正文至少需要 20 个字符。"; return; }
  error.value = ""; submitting.value = true;
  try {
    const response = await forumApi.createPost({ ...form, resourceType: "GENERAL" });
    ElMessage.success("讨论已发布");
    await router.push({ name: "ForumPostDetail", params: { postId: response.data?.id ?? response.data } });
  } catch { error.value = "发布失败，内容已保留，请稍后重试。"; }
  finally { submitting.value = false; }
};
onMounted(loadCategories);
</script>

<style scoped>
.compose-page { max-width: 820px; margin: 0 auto; padding: 10px 8px 50px; }
header { padding: 26px 4px; } h1 { margin: 6px 0; font-size: clamp(28px, 4vw, 40px); } header p { color: var(--text-color-secondary); }
.eyebrow { color: var(--el-color-primary); font-size: 12px; font-weight: 800; letter-spacing: .16em; }
.compose-card { display: grid; gap: 22px; padding: clamp(22px, 5vw, 40px); border: 1px solid var(--border-color-light); border-radius: 22px; background: var(--card-bg); box-shadow: 0 14px 38px var(--shadow-color); }
.field { display: grid; gap: 8px; } label { font-weight: 700; }
input, select, textarea { width: 100%; padding: 13px 14px; color: var(--input-text); border: 1px solid var(--input-border); border-radius: 12px; outline: none; background: var(--input-bg); font: inherit; }
textarea { resize: vertical; line-height: 1.7; } input:focus, select:focus, textarea:focus { border-color: var(--el-color-primary); }
.actions { display: flex; justify-content: flex-end; gap: 10px; }.form-error { margin: 0; color: var(--el-color-danger); }
</style>
