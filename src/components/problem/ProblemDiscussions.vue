<template>
  <section class="discussions">
    <header class="discussions__header">
      <div>
        <h2>题目讨论</h2>
        <p>围绕这道题的思路、边界和实现细节交流。</p>
      </div>
      <el-button type="primary" @click="drawerOpen = true">发起讨论</el-button>
    </header>

    <AsyncState
      :loading="loading"
      :error="loadError"
      :empty="!posts.length"
      empty-title="暂无讨论，来提出第一个问题吧"
      empty-description="请附上你已经尝试的方法，更容易获得有效回复。"
      @retry="loadPosts"
    >
      <template #empty-action>
        <el-button type="primary" plain @click="drawerOpen = true">写第一篇讨论</el-button>
      </template>
      <div class="post-list">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
    </AsyncState>

    <el-drawer v-model="drawerOpen" title="发起题目讨论" size="min(560px, 92vw)" destroy-on-close>
      <form class="discussion-form" @submit.prevent="publish">
        <div>
          <label for="discussion-category">分类</label>
          <select id="discussion-category" v-model="form.categoryId" :disabled="categoryLoading">
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div>
          <label for="discussion-title">讨论标题</label>
          <input id="discussion-title" v-model.trim="form.title" maxlength="100" placeholder="一句话说清你遇到的问题" />
        </div>
        <div>
          <label for="discussion-content">讨论正文</label>
          <textarea id="discussion-content" v-model.trim="form.content" rows="12" maxlength="10000" placeholder="描述已有思路、失败样例和期望结果。" />
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <div class="form-actions">
          <el-button @click="drawerOpen = false">取消</el-button>
          <el-button native-type="submit" type="primary" :loading="publishing" :disabled="categoryLoading">确认发布</el-button>
        </div>
      </form>
    </el-drawer>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { forumApi } from "@/api/community";
import { normalizeCommunityPage, normalizeForumPost } from "@/types/community";
import AsyncState from "@/components/community/AsyncState.vue";
import PostCard from "@/components/community/PostCard.vue";

const props = defineProps({ problemId: { type: [String, Number], required: true } });
const categories = ref([]);
const posts = ref([]);
const loading = ref(true);
const loadError = ref("");
const categoryLoading = ref(true);
const drawerOpen = ref(false);
const publishing = ref(false);
const formError = ref("");
const form = reactive({ categoryId: null, title: "", content: "" });

const loadCategories = async () => {
  categoryLoading.value = true;
  try {
    categories.value = (await forumApi.listCategories()).data || [];
    form.categoryId = categories.value[0]?.id ?? null;
  } catch {
    categories.value = [];
  } finally {
    categoryLoading.value = false;
  }
};

const loadPosts = async () => {
  if (!props.problemId) return;
  loading.value = true;
  loadError.value = "";
  try {
    const page = normalizeCommunityPage(
      (await forumApi.listProblemPosts(props.problemId, { current: 1, size: 20 })).data,
    );
    posts.value = page.items.map(normalizeForumPost);
  } catch {
    posts.value = [];
    loadError.value = "讨论加载失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

const publish = async () => {
  if (!form.categoryId) { formError.value = "暂无可用分类，请联系管理员。"; return; }
  if (form.title.length < 5) { formError.value = "标题至少需要 5 个字符。"; return; }
  if (form.content.length < 20) { formError.value = "正文至少需要 20 个字符。"; return; }
  formError.value = "";
  publishing.value = true;
  try {
    await forumApi.createPost({
      categoryId: form.categoryId,
      resourceType: "PROBLEM",
      resourceId: props.problemId,
      title: form.title,
      content: form.content,
    });
    form.title = "";
    form.content = "";
    drawerOpen.value = false;
    await loadPosts();
    ElMessage.success("讨论已发布");
  } catch {
    formError.value = "发布失败，内容已保留，请稍后重试。";
  } finally {
    publishing.value = false;
  }
};

onMounted(() => { loadCategories(); loadPosts(); });
watch(() => props.problemId, loadPosts);
</script>

<style scoped>
.discussions { padding: 4px; }
.discussions__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.discussions__header h2 { margin: 0 0 5px; }
.discussions__header p { margin: 0; color: var(--text-color-secondary); }
.post-list { display: grid; gap: 12px; }
.discussion-form, .discussion-form > div { display: grid; gap: 9px; }
.discussion-form { gap: 22px; }
.discussion-form label { font-weight: 700; }
.discussion-form input, .discussion-form select, .discussion-form textarea { width: 100%; padding: 13px 14px; color: var(--input-text); border: 1px solid var(--input-border); border-radius: 12px; outline: none; background: var(--input-bg); font: inherit; line-height: 1.65; }
.discussion-form textarea { resize: vertical; }
.discussion-form input:focus, .discussion-form select:focus, .discussion-form textarea:focus { border-color: var(--el-color-primary); }
.form-actions { display: flex !important; grid-auto-flow: column; justify-content: end; }
.form-error { margin: 0; color: var(--el-color-danger); }
@media (max-width: 600px) { .discussions__header { flex-direction: column; } }
</style>
