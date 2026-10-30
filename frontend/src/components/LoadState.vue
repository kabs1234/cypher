<script setup lang="ts">
defineProps<{ isLoading: boolean; error?: string }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <p v-if="isLoading" class="load-state" role="status">Loading…</p>
  <div v-else-if="error" class="load-state load-state-error" role="alert">
    <p>Couldn't load this page: {{ error }}</p>
    <p>Check that the backend is running, then try again.</p>
    <button type="button" class="button button-quiet" @click="$emit('retry')">
      Try again
    </button>
  </div>
  <slot v-else />
</template>

<style scoped>
.load-state {
  padding: var(--space-6) 0;
  color: var(--muted);
}

.load-state-error {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
  color: var(--ink);
}
</style>
