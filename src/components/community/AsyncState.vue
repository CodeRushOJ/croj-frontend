<template>
  <section v-if="loading" class="async-state" role="status" aria-live="polite">
    <el-skeleton :rows="4" animated />
    <span class="sr-only">正在加载</span>
  </section>
  <section v-else-if="error" class="async-state async-state--error" role="alert">
    <div class="state-icon">!</div>
    <h3>内容暂时加载失败</h3>
    <p>{{ error }}</p>
    <el-button type="primary" plain @click="$emit('retry')">重新加载</el-button>
  </section>
  <section v-else-if="empty" class="async-state">
    <div class="state-icon state-icon--soft">◇</div>
    <h3>{{ emptyTitle }}</h3>
    <p v-if="emptyDescription">{{ emptyDescription }}</p>
    <slot name="empty-action" />
  </section>
  <slot v-else />
</template>

<script setup>
defineProps({
  loading: Boolean,
  empty: Boolean,
  error: { type: String, default: "" },
  emptyTitle: { type: String, default: "暂无内容" },
  emptyDescription: { type: String, default: "" },
});

defineEmits(["retry"]);
</script>

<style scoped>
.async-state {
  display: grid;
  place-items: center;
  min-height: 240px;
  padding: 32px;
  text-align: center;
  border: 1px dashed var(--border-color);
  border-radius: 18px;
  background: var(--card-bg);
}
.async-state :deep(.el-skeleton) { width: 100%; }
.async-state h3 { margin: 8px 0 4px; }
.async-state p { margin: 0 0 18px; color: var(--text-color-secondary); }
.state-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 15px;
  color: var(--el-color-danger);
  background: var(--tag-danger-bg);
  font-size: 24px;
  font-weight: 800;
}
.state-icon--soft { color: var(--el-color-primary); background: rgba(64, 158, 255, .12); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
</style>
