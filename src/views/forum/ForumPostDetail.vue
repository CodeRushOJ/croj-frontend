<template>
  <div class="detail-page">
    <router-link class="back-link" :to="{ name: 'Forum' }">← 返回讨论区</router-link>
    <AsyncState :loading="loading" :error="error" :empty="!post" empty-title="讨论不存在" @retry="loadPost">
      <article class="post-detail">
        <el-tag effect="plain">{{ categoryLabel }}</el-tag>
        <h1>{{ post.title }}</h1>
        <div class="byline">{{ post.author?.username || "匿名用户" }} · {{ formatDate(post.createdAt) }}</div>
        <div class="content">{{ post.content }}</div>
      </article>
    </AsyncState>

    <section v-if="post" class="conversation">
      <div class="section-heading"><h2>评论</h2><span>{{ comments.length }} 条交流</span></div>
      <form class="comment-form" @submit.prevent="publishComment">
        <label for="comment-content">评论内容</label>
        <textarea id="comment-content" v-model.trim="commentContent" rows="4" maxlength="1000" placeholder="补充观点，或友善地提出疑问" />
        <p v-if="commentError" class="form-error" role="alert">{{ commentError }}</p>
        <el-button native-type="submit" type="primary" :loading="commenting">发表评论</el-button>
      </form>
      <AsyncState :loading="commentsLoading" :error="commentsError" :empty="!comments.length" empty-title="还没有评论" empty-description="成为第一个参与讨论的人。" @retry="loadComments">
        <div class="comment-list">
          <article v-for="comment in comments" :key="comment.id" class="comment">
            <div><strong>{{ comment.author?.username || "匿名用户" }}</strong><time>{{ formatDate(comment.createdAt) }}</time></div>
            <p>{{ comment.content }}</p>
          </article>
        </div>
      </AsyncState>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { forumApi } from "@/api/community";
import { normalizeCommunityPage, normalizeForumComment, normalizeForumPost } from "@/types/community";
import AsyncState from "@/components/community/AsyncState.vue";

const route = useRoute();
const post = ref(null);
const categories = ref([]);
const comments = ref([]);
const loading = ref(true);
const commentsLoading = ref(true);
const commenting = ref(false);
const error = ref("");
const commentsError = ref("");
const commentContent = ref("");
const commentError = ref("");
const postId = String(route.params.postId);

const categoryLabel = computed(() => {
  const categoryId = post.value?.categoryId;
  if (categoryId == null) return "综合讨论";
  return categories.value.find(
    (category) => String(category.id) === String(categoryId),
  )?.name || `分类 #${categoryId}`;
});
const formatDate = (value) => value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "刚刚";
const loadCategories = async () => {
  try { categories.value = (await forumApi.listCategories()).data || []; }
  catch { categories.value = []; }
};
const loadPost = async () => {
  loading.value = true; error.value = "";
  try { post.value = normalizeForumPost((await forumApi.getPost(postId)).data); }
  catch { error.value = "无法获取这篇讨论，请稍后重试。"; }
  finally { loading.value = false; }
};
const loadComments = async () => {
  commentsLoading.value = true; commentsError.value = "";
  try {
    comments.value = normalizeCommunityPage(
      (await forumApi.listComments(postId, { current: 1, size: 100 })).data,
    ).items.map(normalizeForumComment);
  }
  catch { commentsError.value = "评论加载失败，请稍后重试。"; }
  finally { commentsLoading.value = false; }
};
const publishComment = async () => {
  commentError.value = commentContent.value.length < 2 ? "评论至少需要 2 个字符。" : "";
  if (commentError.value) return;
  commenting.value = true;
  try {
    await forumApi.createComment(postId, { content: commentContent.value });
    commentContent.value = "";
    await loadComments();
    ElMessage.success("评论已发布");
  } catch { commentError.value = "发布失败，请稍后重试。"; }
  finally { commenting.value = false; }
};
onMounted(() => { loadCategories(); loadPost(); loadComments(); });
</script>

<style scoped>
.detail-page { max-width: 900px; margin: 0 auto; padding: 12px 8px 48px; }
.back-link { display: inline-block; margin-bottom: 16px; }
.post-detail, .conversation { padding: clamp(22px, 4vw, 40px); border: 1px solid var(--border-color-light); border-radius: 22px; background: var(--card-bg); box-shadow: 0 10px 34px var(--shadow-color); }
.post-detail h1 { margin: 16px 0 8px; font-size: clamp(28px, 4vw, 42px); line-height: 1.18; }
.byline, .section-heading span, .comment time { color: var(--text-color-secondary); font-size: 13px; }
.content { margin-top: 30px; font-size: 16px; line-height: 1.9; white-space: pre-wrap; }
.conversation { margin-top: 20px; }
.section-heading, .comment > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.section-heading h2 { margin: 0; }
.comment-form { display: grid; gap: 10px; margin: 20px 0; }
.comment-form label { font-weight: 700; }
textarea { width: 100%; padding: 13px 15px; resize: vertical; color: var(--input-text); border: 1px solid var(--input-border); border-radius: 12px; outline: none; background: var(--input-bg); font: inherit; }
textarea:focus { border-color: var(--el-color-primary); }
.comment-list { display: grid; gap: 12px; }
.comment { padding: 18px; border-radius: 14px; background: var(--bg-color); }
.comment p { margin: 10px 0 0; white-space: pre-wrap; }
.form-error { margin: 0; color: var(--el-color-danger); }
</style>
