<script setup lang="ts">
import type { Status } from '@/api/types';

defineProps<{ status: Status }>();
</script>

<template>
  <span v-if="status === 'verified'" class="status status-verified">
    Verified
  </span>
  <span v-else class="status status-draft">
    <span class="status-swatch" aria-hidden="true"></span>
    Unverified draft
  </span>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.15rem 0.6rem 0.15rem 0.2rem;
  border: 2px solid var(--ink);
  border-radius: 999px;
  font-family: var(--font-display);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.status-verified {
  padding-left: 0.6rem;
  background: var(--ink);
  color: var(--paper);
}

.status-draft {
  background: var(--surface);
}

.status-swatch {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: var(--hatch);
}
</style>
