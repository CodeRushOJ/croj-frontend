<template>
  <div class="community-page">
    <header class="hero">
      <div>
        <span class="eyebrow">COMMUNITY</span>
        <h1>讨论，让思路被看见</h1>
        <p>交流算法、比赛复盘与工程实践，和每一位认真解题的人共同成长。</p>
      </div>
      <router-link :to="{ name: 'ForumPostCreate' }"><el-button type="primary" size="large">发布讨论</el-button></router-link>
    </header>

    <section class="toolbar" aria-label="论坛筛选">
      <el-input v-model="filters.keyword" clearable placeholder="搜索标题或内容" @keyup.enter="applyFilters" />
      <el-select v-model="filters.category" placeholder="全部分类" clearable @change="applyFilters">
        <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
      </el-select>
      <el-button @click="applyFilters">搜索</el-button>
    </section>

    <AsyncState
      :loading="loading"
      :error="error"
      :empty="!posts.length"
      empty-title="还没有讨论，来发布第一篇吧"
      empty-description="分享一个问题、一种思路，或一次比赛复盘。"
      @retry="fetchPosts"
    >
      <template #empty-action>
        <router-link :to="{ name: 'ForumPostCreate' }"><el-button type="primary" plain>开始讨论</el-button></router-link>
      </template>
      <div class="post-list">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
    </AsyncState>

    <el-pagination
      v-if="total > filters.size"
      class="pagination"
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="filters.size"
      :current-page="filters.current"
      @current-change="changePage"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { forumApi } from "@/api/community";
import { normalizeCommunityPage, normalizeForumPost } from "@/types/community";
import AsyncState from "@/components/community/AsyncState.vue";
import PostCard from "@/components/community/PostCard.vue";

const categories = ref([]);
const filters = reactive({ current: 1, size: 12, keyword: "", categoryId: null });
const rawPosts = ref([]);
const total = ref(0);
const loading = ref(true);
const error = ref("");
const categoryNames = computed(() => new Map(categories.value.map((category) => [category.id, category.name])));
const posts = computed(() => {
  const keyword = filters.keyword.trim().toLocaleLowerCase();
  return rawPosts.value
    .map((post) => ({
      ...normalizeForumPost(post),
      category: categoryNames.value.get(post.categoryId) || `分类 #${post.categoryId}`,
    }))
    .filter((post) => !keyword || `${post.title} ${post.content}`.toLocaleLowerCase().includes(keyword));
});

const loadCategories = async () => {
  try { categories.value = (await forumApi.listCategories()).data || []; }
  catch { categories.value = []; }
};

const fetchPosts = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await forumApi.listPosts({
      current: filters.current,
      size: filters.size,
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    });
    const page = normalizeCommunityPage(response.data);
    rawPosts.value = page.items;
    total.value = page.total;
  } catch {
    rawPosts.value = [];
    error.value = "请检查网络连接后重试。";
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => { filters.current = 1; fetchPosts(); };
const changePage = (page) => { filters.current = page; fetchPosts(); };
onMounted(() => { loadCategories(); fetchPosts(); });
</script>

<style scoped>
.community-page { max-width: 1080px; margin: 0 auto; padding: 8px 8px 40px; }
.hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; padding: 34px; margin-bottom: 22px; border-radius: 24px; background: linear-gradient(135deg, #172a46, #254b78 62%, #327bc2); box-shadow: 0 18px 45px rgba(24, 58, 96, .25); }
.hero h1, .hero p, .hero .eyebrow { color: #fff; }
.hero h1 { margin: 7px 0 8px; font-size: clamp(26px, 4vw, 42px); line-height: 1.12; }
.hero p { max-width: 650px; margin: 0; opacity: .78; }
.eyebrow { font-size: 12px; letter-spacing: .18em; font-weight: 800; opacity: .72; }
.toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) 180px auto; gap: 12px; padding: 16px; margin-bottom: 18px; border: 1px solid var(--border-color-light); border-radius: 16px; background: var(--card-bg); }
.post-list { display: grid; gap: 14px; }
.pagination { justify-content: center; margin-top: 24px; }
@media (max-width: 720px) { .hero { align-items: flex-start; flex-direction: column; padding: 24px; } .toolbar { grid-template-columns: 1fr; } }
</style>
